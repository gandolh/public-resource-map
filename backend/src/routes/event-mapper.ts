import type { Event } from "@public-resource-map/shared";
import { event } from "../db/schema.js";

/**
 * One row→`Event` mapping, shared by every surface that returns events (the
 * events route, a place's programme, the citywide what's-on). Kept in one file
 * so a new column can never appear on one surface and not the others.
 */
export function rowToEvent(row: typeof event.$inferSelect): Event {
  return {
    id: row.id,
    placeId: row.placeId,
    title: row.title,
    description: row.description,
    category: row.category as Event["category"],
    status: row.status as Event["status"],
    startDate: row.startDate,
    endDate: row.endDate,
    buyUrl: row.buyUrl,
    sourceUrl: row.sourceUrl,
    sourcePlatform: row.sourcePlatform,
    imageUrl: row.imageUrl,
    price: row.price,
    currency: row.currency,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
