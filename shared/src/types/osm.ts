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
  // Brief 34: places OSM no longer has leave the map softly (`retired_at`).
  retired: z.number(), // listed osm places missing from this answer, now hidden
  unretired: z.number(), // retired places this answer contained again, listed again
  retirementHeld: z.number(), // > 0: the answer would have retired more than 10%, so nothing was
  eventsToReview: z.number(), // upcoming events at newly retired places, back in admin review
});

export type OsmSyncResult = z.infer<typeof osmSyncResultSchema>;
