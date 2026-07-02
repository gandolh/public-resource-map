import { z } from "zod";

/**
 * Admin OSM-sync contract (brief 03). A caller POSTs `{ city }` (either a city
 * key like `"timisoara"` or its display name `"Timișoara"`); the backend runs
 * an Overpass query for that city and upserts `source:osm` places, then returns
 * a summary of what changed. See `backend/src/lib/osm-sync.ts` for the cities +
 * bounding boxes and `osm-categories.ts` for the tag → PlaceCategory map.
 */
export const osmSyncRequestSchema = z.object({
  city: z.string().min(1),
});

export type OsmSyncRequest = z.infer<typeof osmSyncRequestSchema>;

export const osmSyncResultSchema = z.object({
  city: z.string(), // resolved display name
  fetched: z.number(), // total OSM elements returned by Overpass
  upserted: z.number(), // inserted + updated
  inserted: z.number(),
  updated: z.number(),
  skippedUnnamed: z.number(), // features with no `name` tag (dropped as noise)
  skippedNoGeometry: z.number(), // features Overpass returned without a point/center
  skippedProtected: z.number(), // matching osm rows left untouched (manual pin)
});

export type OsmSyncResult = z.infer<typeof osmSyncResultSchema>;
