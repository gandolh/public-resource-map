import { and, eq, inArray, isNotNull, notInArray, sql, type SQL } from "drizzle-orm";
import { publisherForUrl, type SourceEntry, type SourceId, type SourceRegistry } from "@public-resource-map/shared";
import type { DB } from "../../db/index.js";
import { event, eventSource, place, stagedEvent } from "../../db/schema.js";

/**
 * What the public may see, by source. The source registry (`shared/src/sources.ts`) is code; the
 * rows are not tagged with it. A row's source is derived from what is stored:
 *
 * - an OSM place is OpenStreetMap's;
 * - an event is its source row's (`staged_event.event_id` → `event_source`), and a source row is
 *   the registry publisher whose host its feed URL is on;
 * - an event venue is the publishers' whose published events created or use it.
 *
 * A `forbidden` source's rows are held back on every public read, never deleted, so flipping the
 * source back in the registry brings them back. An event or venue with no source row (seeded, or
 * made by hand) has no credit and is never held back.
 */
export interface Publication {
  registry: SourceRegistry;
  /** `event_source.id` → the registry source, or null for a row whose feed is in no registry entry. */
  sourceOfRow: Map<string, (SourceEntry & { id: SourceId }) | null>;
  /** The `event_source` rows whose registry source is `forbidden`. */
  forbiddenRows: string[];
  /** True when OpenStreetMap itself is `forbidden`: then every OSM place is held back. */
  osmForbidden: boolean;
}

/** Reads the source rows (a short table) and ties each to the registry. One per request. */
export function publicationOf(db: DB, registry: SourceRegistry): Publication {
  const rows = db.select({ id: eventSource.id, url: eventSource.url }).from(eventSource).all();
  const sourceOfRow = new Map(rows.map((r) => [r.id, publisherForUrl(r.url, registry) ?? null]));
  return {
    registry,
    sourceOfRow,
    forbiddenRows: [...sourceOfRow].flatMap(([id, s]) => (s?.reuse === "forbidden" ? [id] : [])),
    osmForbidden: registry.some((s) => s.kind === "osm" && s.reuse === "forbidden"),
  };
}

/** The events published from a forbidden source row: a subquery, so no id list is ever bound. */
function heldBackEventIds(db: DB, p: Publication) {
  return db
    .select({ id: stagedEvent.eventId })
    .from(stagedEvent)
    .where(and(inArray(stagedEvent.sourceId, p.forbiddenRows), isNotNull(stagedEvent.eventId)));
}

/**
 * The condition that keeps an `event` row public, or undefined when nothing is held back (then
 * every query is exactly what it was before the registry). Built with the query builder: a raw
 * `sql` template would render its columns unqualified inside a subquery.
 */
export function eventPublished(db: DB, p: Publication): SQL | undefined {
  if (p.forbiddenRows.length === 0) return undefined;
  return notInArray(event.id, heldBackEventIds(db, p));
}

/**
 * The condition that keeps a `place` row public, or undefined when nothing is held back. An OSM
 * place goes only if OpenStreetMap does. An event venue goes when every published event that
 * points at it came from a forbidden source: it was made from that source's data.
 */
export function placePublished(db: DB, p: Publication): SQL | undefined {
  const conditions: SQL[] = [];
  if (p.osmForbidden) conditions.push(sql`${place.source} <> 'osm'`);
  if (p.forbiddenRows.length > 0) {
    const forbidden = inArray(stagedEvent.sourceId, p.forbiddenRows);
    const venuesOnlyFromForbidden = db
      .select({ id: stagedEvent.placeId })
      .from(stagedEvent)
      .where(and(isNotNull(stagedEvent.eventId), isNotNull(stagedEvent.placeId)))
      .groupBy(stagedEvent.placeId)
      .having(sql`min(${forbidden}) = 1`);
    conditions.push(sql`(${place.source} <> 'event-venue' OR ${notInArray(place.id, venuesOnlyFromForbidden)})`);
  }
  return conditions.length ? and(...conditions) : undefined;
}

/** Each event's credit: its source row's registry source, or null. */
export function eventCredits(db: DB, p: Publication, eventIds: string[]): Map<string, SourceId | null> {
  const credits = new Map<string, SourceId | null>(eventIds.map((id) => [id, null]));
  if (eventIds.length === 0) return credits;
  const links = db
    .select({ eventId: stagedEvent.eventId, sourceId: stagedEvent.sourceId })
    .from(stagedEvent)
    .where(inArray(stagedEvent.eventId, eventIds))
    .all();
  for (const { eventId, sourceId } of links) {
    const source = p.sourceOfRow.get(sourceId);
    if (eventId && source) credits.set(eventId, source.id);
  }
  return credits;
}

/**
 * Each place's credits, registry order: OpenStreetMap for an OSM place; for an event venue, the
 * publishers (never a forbidden one) whose published events point at it.
 */
export function placeCredits(
  db: DB,
  p: Publication,
  places: { id: string; source: string }[],
): Map<string, SourceId[]> {
  const osm = p.registry.filter((s) => s.kind === "osm").map((s) => s.id);
  const found = new Map<string, Set<SourceId>>();
  const venueIds = places.filter((r) => r.source === "event-venue").map((r) => r.id);
  if (venueIds.length > 0) {
    const links = db
      .selectDistinct({ placeId: stagedEvent.placeId, sourceId: stagedEvent.sourceId })
      .from(stagedEvent)
      .where(and(inArray(stagedEvent.placeId, venueIds), isNotNull(stagedEvent.eventId)))
      .all();
    for (const { placeId, sourceId } of links) {
      const source = p.sourceOfRow.get(sourceId);
      if (!placeId || !source || source.reuse === "forbidden") continue;
      found.set(placeId, (found.get(placeId) ?? new Set()).add(source.id));
    }
  }
  const order = (ids: Set<SourceId>) => p.registry.map((s) => s.id).filter((id) => ids.has(id));
  return new Map(places.map((r) => [r.id, r.source === "osm" ? osm : order(found.get(r.id) ?? new Set<SourceId>())]));
}

/** True when the event with this id is held back. For single-row writes (favouriting an event). */
export function isEventHeldBack(db: DB, p: Publication, eventId: string): boolean {
  if (p.forbiddenRows.length === 0) return false;
  const row = db
    .select({ id: stagedEvent.id })
    .from(stagedEvent)
    .where(and(eq(stagedEvent.eventId, eventId), inArray(stagedEvent.sourceId, p.forbiddenRows)))
    .get();
  return row !== undefined;
}
