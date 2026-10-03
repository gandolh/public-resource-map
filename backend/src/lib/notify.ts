import { randomUUID } from "node:crypto";
import { inArray } from "drizzle-orm";
import type { DB } from "../db/index.js";
import { favoritePlace, notification, notificationEvent } from "../db/schema.js";

/**
 * The new-events trigger (brief 05; decisions.md → Favorites & notifications).
 * Fired at the admin-accept step, never at scrape time: only accepted events
 * notify. One accept is one batch, and a batch makes **one** inbox item per
 * (person, place) however many events it published there ("8 new events at
 * Muzeul de Artă"), so a busy place cannot flood a bell.
 *
 * Returns how many inbox items it wrote.
 */
export function notifyNewEvents(
  db: DB,
  published: { eventId: string; placeId: string }[],
  now: Date,
): number {
  if (published.length === 0) return 0;
  const byPlace = new Map<string, string[]>();
  for (const { eventId, placeId } of published) {
    byPlace.set(placeId, [...(byPlace.get(placeId) ?? []), eventId]);
  }
  const batchId = randomUUID();
  const at = now.toISOString();
  let written = 0;

  db.transaction((tx) => {
    const fans = tx
      .select({ subject: favoritePlace.subject, placeId: favoritePlace.placeId })
      .from(favoritePlace)
      .where(inArray(favoritePlace.placeId, [...byPlace.keys()]))
      .all();
    for (const { subject, placeId } of fans) {
      const eventIds = byPlace.get(placeId)!;
      const row = tx
        .insert(notification)
        .values({ subject, kind: "new-event", placeId, batchId, createdAt: at })
        .returning({ id: notification.id })
        .get();
      tx.insert(notificationEvent)
        .values(eventIds.map((eventId) => ({ notificationId: row.id, eventId })))
        .run();
      written++;
    }
  });
  return written;
}

/** The events a new-event notification covers. */
export function notificationEvents(db: DB, ids: string[]) {
  if (ids.length === 0) return [];
  return db
    .select({ notificationId: notificationEvent.notificationId, eventId: notificationEvent.eventId })
    .from(notificationEvent)
    .where(inArray(notificationEvent.notificationId, ids))
    .all();
}

