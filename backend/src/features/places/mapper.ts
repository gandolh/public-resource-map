import type { Place } from "@public-resource-map/shared";
import type { place } from "../../db/schema.js";

/** A place row as the API answers it, with its upcoming-event count when the query asked for one. */
export function rowToPlace(row: typeof place.$inferSelect & { upcomingEventCount?: number }): Place {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category as Place["category"],
    source: row.source as Place["source"],
    osmType: row.osmType,
    osmId: row.osmId,
    isManualPin: row.isManualPin,
    address: row.address,
    city: row.city,
    coordinates: { lat: row.lat, lng: row.lng },
    website: row.website,
    phone: row.phone,
    openingHours: row.openingHours,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    ...(row.upcomingEventCount === undefined ? {} : { upcomingEventCount: row.upcomingEventCount }),
  };
}
