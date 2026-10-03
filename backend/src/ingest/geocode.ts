import { eq } from "drizzle-orm";
import type { DB } from "../db/index.js";
import { geocodeCache } from "../db/schema.js";
import type { CityConfig } from "../lib/osm-sync.js";
import { normalizeAddress } from "./match.js";

/**
 * Geocoding, only as the fallback for a venue no place matched (decisions.md →
 * Geocoding). Public Nominatim within its policy: one request a second, an
 * identifying User-Agent, never on user traffic (a refresh is admin-triggered),
 * and every address asked at most once, ever, through `geocode_cache`.
 */

export interface GeocodeHit {
  lat: number;
  lng: number;
  importance: number | null;
  /** Nominatim's `addresstype`, e.g. `building`, `road`, `city`. */
  granularity: string | null;
  raw: unknown;
}

/** The provider: one query in, the best hit or none out. */
export type GeocodeProvider = (query: string, city: CityConfig) => Promise<GeocodeHit | null>;

/** Areas, not points: a pin at a city's or district's centroid is wrong, not approximate. */
const TOO_COARSE = new Set([
  "country", "state", "region", "province", "county", "municipality", "city", "town",
  "village", "suburb", "city_district", "district", "borough", "quarter", "postcode",
  "administrative",
]);
/** Nominatim's 0–1 importance; starts permissive, to be tuned on real data. */
const MIN_IMPORTANCE = 0;

/** Why a hit may not become a live pin, or null when it may (decisions.md's three checks). */
export function rejectReason(hit: GeocodeHit, city: CityConfig): string | null {
  const { south, west, north, east } = city.bbox;
  if (hit.lat < south || hit.lat > north || hit.lng < west || hit.lng > east) {
    return `outside ${city.name}`;
  }
  if (hit.granularity && TOO_COARSE.has(hit.granularity)) return `too coarse (${hit.granularity})`;
  if (hit.importance !== null && hit.importance < MIN_IMPORTANCE) return "low importance";
  return null;
}

/**
 * Coordinates for an address, or null for manual pinning. A miss or a rejected
 * hit is cached too (as null coordinates), so a bad address is not re-asked on
 * every refresh.
 */
export async function geocodeAddress(
  db: DB,
  provider: GeocodeProvider,
  address: string,
  city: CityConfig,
): Promise<{ lat: number; lng: number } | null> {
  const key = normalizeAddress(address, city.name);
  const cached = await db.select().from(geocodeCache).where(eq(geocodeCache.normalizedAddress, key)).get();
  if (cached) return cached.lat !== null && cached.lng !== null ? { lat: cached.lat, lng: cached.lng } : null;

  const hit = await provider(`${address}, ${city.name}`, city);
  const usable = hit && rejectReason(hit, city) === null ? hit : null;
  await db
    .insert(geocodeCache)
    .values({
      normalizedAddress: key,
      city: city.name,
      lat: usable?.lat ?? null,
      lng: usable?.lng ?? null,
      importance: hit?.importance ?? null,
      granularity: hit?.granularity ?? null,
      raw: hit ? JSON.stringify(hit.raw) : null,
    })
    .onConflictDoNothing()
    .run();
  return usable ? { lat: usable.lat, lng: usable.lng } : null;
}

/**
 * Public Nominatim, at most one request a second however many callers queue.
 * Returns null without a User-Agent: the policy requires an identifying one,
 * so with none configured every unmatched venue goes to manual pinning.
 */
export function nominatimProvider(opts: {
  userAgent: string | undefined;
  fetchImpl?: typeof fetch;
  minIntervalMs?: number;
}): GeocodeProvider | null {
  if (!opts.userAgent?.trim()) return null;
  const doFetch = opts.fetchImpl ?? fetch;
  const interval = opts.minIntervalMs ?? 1000;
  let next = 0;
  let queue: Promise<unknown> = Promise.resolve();

  return (query, city) => {
    const run = async (): Promise<GeocodeHit | null> => {
      const { south, west, north, east } = city.bbox;
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.search = new URLSearchParams({
        format: "jsonv2",
        limit: "1",
        countrycodes: "ro",
        q: query,
        viewbox: `${west},${north},${east},${south}`,
        bounded: "1",
      }).toString();
      // The spacing is measured between requests leaving, so it is taken
      // right before the fetch.
      const wait = next - Date.now();
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      next = Date.now() + interval;
      const res = await doFetch(url, {
        headers: { "user-agent": opts.userAgent!.trim() },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) throw new Error(`Nominatim answered ${res.status}`);
      const [first] = (await res.json()) as {
        lat: string;
        lon: string;
        importance?: number;
        addresstype?: string;
      }[];
      if (!first) return null;
      return {
        lat: Number(first.lat),
        lng: Number(first.lon),
        importance: first.importance ?? null,
        granularity: first.addresstype ?? null,
        raw: first,
      };
    };
    const result = queue.then(run, run);
    queue = result.catch(() => undefined);
    return result;
  };
}
