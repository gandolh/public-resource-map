import { z } from "zod";

export const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export type Coordinates = z.infer<typeof coordinatesSchema>;

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  code: string;
  message: string;
}

/** Shared query schema for "find things near a point within a radius". */
export const nearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().min(0.1).max(100).default(5),
  category: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type NearbyQuery = z.infer<typeof nearbyQuerySchema>;

/**
 * The event-timing lens shared by the map, the what's-on index and the place
 * panel. Windows are computed in Europe/Bucharest (see backend `lib/time.ts`),
 * never in UTC — "today" means today *here*.
 *
 * Locked decision: the lens HARD-FILTERS places (removes non-matching pins)
 * rather than dimming them; at city pin density, dimming is invisible.
 */
export const eventLenses = ["today", "weekend", "all"] as const;
export const eventLensSchema = z.enum(eventLenses);
export type EventLens = z.infer<typeof eventLensSchema>;

/**
 * A comma-separated query list (`?category=park,museum`). Kept as a plain
 * string on the wire so the URL stays readable and shareable.
 */
export const csvSchema = z
  .string()
  .transform((raw) => raw.split(",").map((v) => v.trim()).filter(Boolean));

/** Parse a `?category=a,b` param into a list, tolerating absent/empty values. */
export function parseCsv(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw.split(",").map((v) => v.trim()).filter(Boolean);
}

/**
 * Query for `GET /api/places` — serves the map from SQLite (never Overpass).
 * `city` filters to one city's places (primary lens); `lat`/`lng`/`radiusKm`
 * add an optional bounding-box filter (kept so the existing nearby map fetch
 * keeps working). Any subset may be supplied; category + pagination are shared.
 */
export const placesQuerySchema = z.object({
  city: z.string().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().min(0.1).max(100).default(5),
  /** Comma-separated `PlaceCategory` list; empty/absent means "all". */
  category: z.string().optional(),
  /**
   * `today`/`weekend` restrict the result to places holding at least one event
   * in that window (a hard filter, per the locked UI decision). `all` returns
   * every place, each carrying its upcoming-event count.
   */
  lens: eventLensSchema.default("all"),
  page: z.coerce.number().int().min(1).default(1),
  // The map loads a whole city at once so clustering is computed client-side.
  pageSize: z.coerce.number().int().min(1).max(1000).default(50),
});

export type PlacesQuery = z.infer<typeof placesQuerySchema>;

/**
 * Query for `GET /api/places/:id/events` — the "what's on here" list behind a
 * place panel. Upcoming only; ordered by start.
 */
export const placeEventsQuerySchema = z.object({
  lens: eventLensSchema.default("all"),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export type PlaceEventsQuery = z.infer<typeof placeEventsQuerySchema>;

/**
 * Query for `GET /api/whats-on` — the citywide, date-first lens on the same
 * data the map shows. Honours the same filters as the map so the two surfaces
 * can never disagree.
 */
export const whatsOnQuerySchema = z.object({
  city: z.string().optional(),
  /** Comma-separated `PlaceCategory` list — the map's chips, not a second taxonomy. */
  category: z.string().optional(),
  lens: eventLensSchema.default("all"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(30),
});

export type WhatsOnQuery = z.infer<typeof whatsOnQuerySchema>;
