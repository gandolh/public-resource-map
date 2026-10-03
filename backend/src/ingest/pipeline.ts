import { createHash } from "node:crypto";
import { and, eq, inArray, isNotNull, lt } from "drizzle-orm";
import {
  rawEventSchema,
  type RawEvent,
  type RefreshSummary,
  type ResolvePlaceInput,
  type SourceHealth,
  type StagedStatus,
} from "@public-resource-map/shared";
import type { DB } from "../db/index.js";
import { event, eventSource, place, stagedEvent } from "../db/schema.js";
import { resolveCity, type CityConfig } from "../lib/osm-sync.js";
import { zonedParts } from "../lib/time.js";
import { adapterFor, builtInAdapters, fetchText, type AdapterRegistry } from "./adapters.js";
import { geocodeAddress, nominatimProvider, type GeocodeProvider } from "./geocode.js";
import { matchVenue, normalizeText, normalizeVenue } from "./match.js";

/**
 * The event ingestion pipeline (brief 04): fetch → validate → dedup → match
 * venue to place → geocode the rest → reconcile with what is already live →
 * a staged diff. Nothing reaches the public `event` table until an admin
 * accepts it.
 */

export interface IngestDeps {
  adapters: AdapterRegistry;
  /** Null when no identifying User-Agent is configured: unmatched venues go to manual pinning. */
  geocoder: GeocodeProvider | null;
  fetchText: (url: string) => Promise<string>;
  now: () => Date;
  /** Refuses adapters that have not cleared the legal posture (the iaBilet rule). */
  production: boolean;
}

export function defaultIngestDeps(): IngestDeps {
  return {
    adapters: builtInAdapters,
    geocoder: nominatimProvider({ userAgent: process.env.NOMINATIM_USER_AGENT }),
    fetchText,
    now: () => new Date(),
    production: process.env.NODE_ENV === "production",
  };
}

/** Sources flicker: an accepted event must be missing this long before it turns stale. */
export const GRACE_MS = 3 * 24 * 60 * 60 * 1000;
/** A run below this share of the last one is suspect, once the last one was big enough to judge by. */
const SUSPECT_RATIO = 0.5;
const SUSPECT_MIN_PREVIOUS = 4;

export class IngestError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

const PENDING: StagedStatus[] = ["new", "changed", "needs-attention"];

type StagedRow = typeof stagedEvent.$inferSelect;

/** The Bucharest calendar day of an instant: cross-source dedup compares days, not seconds. */
function bucharestDay(iso: string): string {
  const p = zonedParts(new Date(iso));
  return `${p.year}-${p.month}-${p.day}`;
}

/** The source's own identity for a listing: its UID, or failing that its URL, start and title. */
function listingKey(e: RawEvent): string {
  if (e.externalId) return `id:${e.externalId}`;
  return `url:${e.sourceUrl ?? ""}|${e.startDate}|${normalizeText(e.title)}`;
}

/** A key for a row that did not even validate, so it is quarantined once, not once per refresh. */
function quarantineKey(raw: Record<string, unknown>): string {
  if (typeof raw.externalId === "string" && raw.externalId) return `id:${raw.externalId}`;
  return `raw:${createHash("sha1").update(JSON.stringify(raw)).digest("hex")}`;
}

const sameInstant = (a: string | null | undefined, b: string | null | undefined) =>
  (a ? Date.parse(a) : null) === (b ? Date.parse(b) : null);

/** The staged columns a validated listing fills. */
function listingFields(e: RawEvent, sourceName: string) {
  return {
    title: e.title,
    normalizedTitle: normalizeText(e.title),
    description: e.description ?? null,
    category: e.category ?? "other",
    venueName: e.venue,
    rawAddress: e.address ?? null,
    startDate: e.startDate,
    endDate: e.endDate ?? null,
    buyUrl: e.buyUrl ?? null,
    sourceUrl: e.sourceUrl ?? null,
    sourcePlatform: sourceName,
    price: e.price ?? null,
    currency: e.currency ?? null,
    payload: JSON.stringify(e),
  };
}

/** Run one source's refresh and stage its diff. */
export async function refreshSource(db: DB, sourceId: string, deps: IngestDeps): Promise<RefreshSummary> {
  const source = await db.select().from(eventSource).where(eq(eventSource.id, sourceId)).get();
  if (!source) throw new IngestError("SOURCE_NOT_FOUND", "No such source", 404);
  if (!source.enabled) throw new IngestError("SOURCE_DISABLED", `${source.name} is disabled`, 409);
  const adapter = adapterFor(source.adapterKey, deps.adapters);
  if (!adapter) throw new IngestError("UNKNOWN_ADAPTER", `No adapter for ${source.adapterKey}`);
  if (deps.production && !adapter.productionAllowed) {
    throw new IngestError("ADAPTER_NOT_ALLOWED", `${source.adapterKey} may not run in production`, 403);
  }
  const city = source.city ? resolveCity(source.city) : null;
  if (!city) throw new IngestError("UNKNOWN_CITY", `${source.name} has no known city`);

  const now = deps.now();
  const runAt = now.toISOString();
  const summary: RefreshSummary = {
    sourceId,
    status: "ok",
    fetched: 0,
    new: 0,
    changed: 0,
    unchanged: 0,
    duplicates: 0,
    needsAttention: 0,
    ambiguous: 0,
    unmatched: 0,
    stale: 0,
    silentUpdates: 0,
  };

  let rows;
  try {
    rows = await adapter.read({ source, fetchText: deps.fetchText });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(eventSource)
      .set({ lastStatus: "error", lastRunAt: runAt, updatedAt: runAt })
      .where(eq(eventSource.id, sourceId))
      .run();
    return { ...summary, status: "error", error: message };
  }

  const cityPlaces = await db
    .select({ id: place.id, name: place.name })
    .from(place)
    .where(eq(place.city, city.name))
    .all();
  const existingFor = async (key: string) =>
    db
      .select()
      .from(stagedEvent)
      .where(and(eq(stagedEvent.sourceId, sourceId), eq(stagedEvent.externalKey, key)))
      .get();

  const seen = new Set<string>();
  for (const row of rows) {
    const parsed = row.problem ? null : rawEventSchema.safeParse(row.raw);
    if (!parsed?.success) {
      // Quarantine: a mis-parsing adapter fills needs-attention, never the diff.
      const key = quarantineKey(row.raw);
      if (seen.has(key)) continue;
      seen.add(key);
      summary.needsAttention++;
      const issues = row.problem ?? parsed?.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      const existing = await existingFor(key);
      const fields = {
        status: "needs-attention" as const,
        matchStatus: "unmatched",
        title: typeof row.raw.title === "string" && row.raw.title.trim() ? row.raw.title : "(untitled)",
        startDate: typeof row.raw.startDate === "string" ? row.raw.startDate : runAt,
        venueName: typeof row.raw.venue === "string" ? row.raw.venue : null,
        payload: JSON.stringify({ raw: row.raw, issues }),
        lastSeenAt: runAt,
        updatedAt: runAt,
      };
      if (existing && existing.status !== "needs-attention") {
        await db.update(stagedEvent).set({ lastSeenAt: runAt }).where(eq(stagedEvent.id, existing.id)).run();
      } else if (existing) {
        await db.update(stagedEvent).set(fields).where(eq(stagedEvent.id, existing.id)).run();
      } else {
        await db.insert(stagedEvent).values({ sourceId, externalKey: key, ...fields }).run();
      }
      continue;
    }

    const e = parsed.data;
    summary.fetched++;
    const key = listingKey(e);
    if (seen.has(key)) {
      summary.duplicates++;
      continue;
    }
    seen.add(key);

    const existing = await existingFor(key);
    if (existing && existing.status !== "needs-attention") {
      await reconcile(db, existing, e, source.name, cityPlaces, city, deps.geocoder, runAt, summary);
      continue;
    }

    if (await isCrossSourceDuplicate(db, e, sourceId, city)) {
      summary.duplicates++;
      continue;
    }

    const resolved = await resolveVenue(db, e, cityPlaces, city, deps.geocoder);
    if (resolved.matchStatus === "ambiguous") summary.ambiguous++;
    if (resolved.matchStatus === "unmatched") summary.unmatched++;
    summary.new++;
    const values = {
      ...listingFields(e, source.name),
      ...resolved,
      status: "new" as const,
      lastSeenAt: runAt,
      updatedAt: runAt,
    };
    if (existing) {
      // A listing that used to be quarantined and now parses: it joins the diff.
      await db.update(stagedEvent).set(values).where(eq(stagedEvent.id, existing.id)).run();
    } else {
      await db.insert(stagedEvent).values({ sourceId, externalKey: key, ...values }).run();
    }
  }

  summary.stale = await markVanished(db, sourceId, new Date(now.getTime() - GRACE_MS).toISOString(), runAt);

  const previous = source.lastEventCount;
  const status: SourceHealth =
    summary.fetched === 0 ||
    (previous !== null && previous >= SUSPECT_MIN_PREVIOUS && summary.fetched < previous * SUSPECT_RATIO)
      ? "suspect"
      : "ok";
  summary.status = status;
  await db
    .update(eventSource)
    .set({
      lastStatus: status,
      lastEventCount: summary.fetched,
      lastRunAt: runAt,
      lastSuccessfulAt: runAt,
      updatedAt: runAt,
    })
    .where(eq(eventSource.id, sourceId))
    .run();
  return summary;
}

/** Match first (free), geocode only what no place matched (decisions.md → Geocoding). */
async function resolveVenue(
  db: DB,
  e: RawEvent,
  cityPlaces: { id: string; name: string }[],
  city: CityConfig,
  geocoder: GeocodeProvider | null,
) {
  const match = matchVenue(e.venue, cityPlaces, city.name);
  const base = {
    matchStatus: match.status,
    placeId: match.status === "auto-matched" ? match.placeId : null,
    candidates: match.candidates.length ? JSON.stringify(match.candidates) : null,
    lat: null as number | null,
    lng: null as number | null,
  };
  if (match.status !== "unmatched" || !geocoder) return base;
  const coords = await geocodeAddress(db, geocoder, e.address ?? e.venue, city).catch(() => null);
  return coords ? { ...base, ...coords } : base;
}

/**
 * The same event already live, or already waiting, from another source:
 * normalized title, same Bucharest day, same city (decisions.md → dedup).
 */
async function isCrossSourceDuplicate(db: DB, e: RawEvent, sourceId: string, city: CityConfig) {
  const title = normalizeText(e.title);
  const day = bucharestDay(e.startDate);
  const live = await db
    .select({ startDate: event.startDate })
    .from(event)
    .innerJoin(place, eq(place.id, event.placeId))
    .where(and(eq(event.normalizedTitle, title), eq(place.city, city.name)))
    .all();
  if (live.some((r) => bucharestDay(r.startDate) === day)) return true;
  const staged = await db
    .select({ startDate: stagedEvent.startDate, sourceId: stagedEvent.sourceId })
    .from(stagedEvent)
    .innerJoin(eventSource, eq(eventSource.id, stagedEvent.sourceId))
    .where(
      and(
        eq(stagedEvent.normalizedTitle, title),
        eq(eventSource.city, city.name),
        inArray(stagedEvent.status, ["new", "changed"]),
      ),
    )
    .all();
  return staged.some((r) => r.sourceId !== sourceId && bucharestDay(r.startDate) === day);
}

/**
 * A listing seen before. Accepted: compare with the live event, tiered
 * (decisions.md): when, where or whether it happens goes back to the admin as
 * `changed`; price, text and links update silently; nothing else matters.
 * Still pending: take the latest version. Rejected: stays rejected.
 */
async function reconcile(
  db: DB,
  existing: StagedRow,
  e: RawEvent,
  sourceName: string,
  cityPlaces: { id: string; name: string }[],
  city: CityConfig,
  geocoder: GeocodeProvider | null,
  runAt: string,
  summary: RefreshSummary,
) {
  const seenNow = { lastSeenAt: runAt, updatedAt: runAt };
  if (existing.status === "rejected") {
    await db.update(stagedEvent).set(seenNow).where(eq(stagedEvent.id, existing.id)).run();
    summary.unchanged++;
    return;
  }

  const venueMoved = normalizeVenue(existing.venueName ?? "") !== normalizeVenue(e.venue);
  const rematch = venueMoved ? await resolveVenue(db, e, cityPlaces, city, geocoder) : {};

  if (existing.status !== "accepted" || !existing.eventId) {
    await db
      .update(stagedEvent)
      .set({ ...listingFields(e, sourceName), ...rematch, ...seenNow })
      .where(eq(stagedEvent.id, existing.id))
      .run();
    summary.unchanged++;
    return;
  }

  const live = await db.select().from(event).where(eq(event.id, existing.eventId)).get();
  if (!live) return;
  const reReview =
    !sameInstant(live.startDate, e.startDate) ||
    !sameInstant(live.endDate, e.endDate) ||
    venueMoved ||
    e.cancelled === true;
  if (reReview) {
    await db
      .update(stagedEvent)
      .set({ ...listingFields(e, sourceName), ...rematch, status: "changed", ...seenNow })
      .where(eq(stagedEvent.id, existing.id))
      .run();
    summary.changed++;
    return;
  }

  const silent = {
    description: e.description ?? null,
    buyUrl: e.buyUrl ?? null,
    sourceUrl: e.sourceUrl ?? null,
    price: e.price ?? null,
    currency: e.currency ?? null,
  };
  const differs = (Object.keys(silent) as (keyof typeof silent)[]).some((k) => (live[k] ?? null) !== silent[k]);
  // A listing back after going stale is live again.
  const revive = live.status === "stale" ? { status: "live" } : {};
  if (differs || live.status === "stale") {
    await db.update(event).set({ ...silent, ...revive, updatedAt: runAt }).where(eq(event.id, live.id)).run();
    if (differs) summary.silentUpdates++;
  }
  if (!differs) summary.unchanged++;
  await db
    .update(stagedEvent)
    .set({ ...listingFields(e, sourceName), ...seenNow })
    .where(eq(stagedEvent.id, existing.id))
    .run();
}

/** Accepted events the source stopped listing more than the grace window ago turn stale. */
async function markVanished(db: DB, sourceId: string, cutoff: string, runAt: string): Promise<number> {
  const gone = await db
    .select({ eventId: stagedEvent.eventId })
    .from(stagedEvent)
    .where(
      and(
        eq(stagedEvent.sourceId, sourceId),
        eq(stagedEvent.status, "accepted"),
        isNotNull(stagedEvent.eventId),
        lt(stagedEvent.lastSeenAt, cutoff),
      ),
    )
    .all();
  const ids = gone.map((g) => g.eventId!).filter(Boolean);
  if (ids.length === 0) return 0;
  const result = await db
    .update(event)
    .set({ status: "stale", updatedAt: runAt })
    .where(and(inArray(event.id, ids), eq(event.status, "live")))
    .run();
  return result.changes;
}

export interface AcceptResult {
  accepted: { stagedId: string; eventId: string }[];
  skipped: { id: string; reason: string }[];
}

/**
 * Accept staged rows: each becomes (or updates) a live event, in its own
 * transaction. A row with no place yet is skipped with a reason: an event
 * always has a place (resolve it first, or drop a manual pin). The accepted
 * event ids are what brief 05's "new at a favourite place" trigger reads.
 */
export function acceptStaged(db: DB, ids: string[], now: Date): AcceptResult {
  const result: AcceptResult = { accepted: [], skipped: [] };
  const at = now.toISOString();
  for (const id of ids) {
    db.transaction((tx) => {
      const row = tx.select().from(stagedEvent).where(eq(stagedEvent.id, id)).get();
      if (!row) return void result.skipped.push({ id, reason: "not found" });
      if (row.status !== "new" && row.status !== "changed") {
        return void result.skipped.push({ id, reason: `is ${row.status}` });
      }
      const source = tx.select().from(eventSource).where(eq(eventSource.id, row.sourceId)).get();
      const cityName = source?.city ? (resolveCity(source.city)?.name ?? source.city) : null;

      let placeId = row.placeId;
      if (!placeId && row.lat !== null && row.lng !== null && cityName) {
        placeId = venuePlace(tx, row, cityName, at);
      }
      if (!placeId) return void result.skipped.push({ id, reason: "needs a place: pick one or drop a pin" });

      const cancelled = (JSON.parse(row.payload ?? "{}") as { cancelled?: boolean }).cancelled === true;
      const fields = {
        placeId,
        title: row.title,
        normalizedTitle: row.normalizedTitle,
        description: row.description,
        category: row.category ?? "other",
        startDate: row.startDate,
        endDate: row.endDate,
        buyUrl: row.buyUrl,
        sourceUrl: row.sourceUrl,
        sourcePlatform: row.sourcePlatform,
        price: row.price,
        currency: row.currency,
        status: cancelled ? "ended" : "live",
        updatedAt: at,
      };
      let eventId = row.eventId;
      if (eventId) {
        tx.update(event).set(fields).where(eq(event.id, eventId)).run();
      } else {
        eventId = tx.insert(event).values(fields).returning({ id: event.id }).get().id;
      }
      tx.update(stagedEvent)
        .set({ status: "accepted", eventId, placeId, updatedAt: at })
        .where(eq(stagedEvent.id, id))
        .run();
      result.accepted.push({ stagedId: id, eventId });
    });
  }
  return result;
}

type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];

/**
 * The place for a venue no OSM place matched. Reused when an earlier accept
 * already created it, so two events at "Club Daos" share one pin.
 */
function venuePlace(tx: Tx, row: StagedRow, cityName: string, at: string): string {
  const name = row.venueName ?? row.title;
  const wanted = normalizeVenue(name);
  const known = tx
    .select({ id: place.id, name: place.name })
    .from(place)
    .where(and(eq(place.city, cityName), eq(place.source, "event-venue")))
    .all()
    .find((p) => normalizeVenue(p.name) === wanted);
  if (known) return known.id;
  return tx
    .insert(place)
    .values({
      name,
      category: "other",
      source: "event-venue",
      isManualPin: row.matchStatus === "manual",
      address: row.rawAddress,
      city: cityName,
      lat: row.lat!,
      lng: row.lng!,
      updatedAt: at,
    })
    .returning({ id: place.id })
    .get().id;
}

/** Reject pending rows; a rejected listing does not come back on later refreshes. */
export async function rejectStaged(db: DB, ids: string[], now: Date) {
  const res = await db
    .update(stagedEvent)
    .set({ status: "rejected", updatedAt: now.toISOString() })
    .where(and(inArray(stagedEvent.id, ids), inArray(stagedEvent.status, PENDING)))
    .run();
  return { rejected: res.changes };
}

/** Settle a staged row's place: an existing place in its city, or a manual pin inside the city. */
export async function resolveStagedPlace(db: DB, id: string, input: ResolvePlaceInput, now: Date) {
  const row = await db.select().from(stagedEvent).where(eq(stagedEvent.id, id)).get();
  if (!row) throw new IngestError("STAGED_NOT_FOUND", "No such staged event", 404);
  if (!PENDING.includes(row.status as StagedStatus) || row.status === "needs-attention") {
    throw new IngestError("NOT_RESOLVABLE", `A ${row.status} row cannot be placed`, 409);
  }
  const source = await db.select().from(eventSource).where(eq(eventSource.id, row.sourceId)).get();
  const city = source?.city ? resolveCity(source.city) : null;
  if (!city) throw new IngestError("UNKNOWN_CITY", "The row's source has no known city");
  const at = now.toISOString();

  if ("placeId" in input) {
    const target = await db.select().from(place).where(eq(place.id, input.placeId)).get();
    if (!target || target.city !== city.name) {
      throw new IngestError("PLACE_NOT_IN_CITY", `No such place in ${city.name}`, 400);
    }
    await db
      .update(stagedEvent)
      .set({ placeId: target.id, matchStatus: "manual", lat: null, lng: null, updatedAt: at })
      .where(eq(stagedEvent.id, id))
      .run();
  } else {
    const { south, west, north, east } = city.bbox;
    if (input.lat < south || input.lat > north || input.lng < west || input.lng > east) {
      throw new IngestError("PIN_OUTSIDE_CITY", `That point is outside ${city.name}`, 400);
    }
    await db
      .update(stagedEvent)
      .set({ placeId: null, matchStatus: "manual", lat: input.lat, lng: input.lng, updatedAt: at })
      .where(eq(stagedEvent.id, id))
      .run();
  }
  return db.select().from(stagedEvent).where(eq(stagedEvent.id, id)).get();
}

/** The diff, newest first; pending rows unless a status is asked for. */
export async function listStaged(db: DB, filter: { sourceId?: string; status?: StagedStatus }) {
  const rows = await db
    .select()
    .from(stagedEvent)
    .where(
      and(
        filter.sourceId ? eq(stagedEvent.sourceId, filter.sourceId) : undefined,
        filter.status ? eq(stagedEvent.status, filter.status) : inArray(stagedEvent.status, PENDING),
      ),
    )
    .orderBy(stagedEvent.startDate)
    .limit(1000)
    .all();
  return rows.map(({ payload, candidates, ...r }) => {
    const parsed = payload ? (JSON.parse(payload) as { issues?: string; cancelled?: boolean }) : {};
    return {
      ...r,
      candidates: candidates ? (JSON.parse(candidates) as unknown[]) : [],
      issues: parsed.issues ?? null,
      cancelled: parsed.cancelled === true,
    };
  });
}

