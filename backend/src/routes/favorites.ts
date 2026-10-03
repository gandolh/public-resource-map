import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { markReadSchema, type FavoritesDto, type InboxDto, type NotificationDto } from "@public-resource-map/shared";
import { event, favoriteEvent, favoritePlace, notification, notificationEvent, place } from "../db/schema.js";

/**
 * Favourites and the inbox (brief 05). Everything here is per person, keyed on
 * Ward's subject, and behind `requireAuth`. Adding and removing are idempotent,
 * so a double tap or a retried request leaves one row or none.
 */
export async function favoriteRoutes(app: FastifyInstance) {
  const db = app.db;
  const guard = { preHandler: app.requireAuth };
  const subjectOf = (req: FastifyRequest) => req.ward!.subject;
  const notFound = (reply: FastifyReply, what: string) =>
    reply.status(404).send({ code: "NOT_FOUND", message: `No such ${what}` });

  app.get("/favorites", guard, async (req): Promise<FavoritesDto> => {
    const subject = subjectOf(req);
    const places = await db.select({ id: favoritePlace.placeId }).from(favoritePlace).where(eq(favoritePlace.subject, subject)).all();
    const events = await db.select({ id: favoriteEvent.eventId }).from(favoriteEvent).where(eq(favoriteEvent.subject, subject)).all();
    return { places: places.map((p) => p.id), events: events.map((e) => e.id) };
  });

  app.post<{ Params: { placeId: string } }>("/favorites/places/:placeId", guard, async (req, reply) => {
    const target = await db.select({ id: place.id }).from(place).where(eq(place.id, req.params.placeId)).get();
    if (!target) return notFound(reply, "place");
    await db.insert(favoritePlace).values({ subject: subjectOf(req), placeId: target.id }).onConflictDoNothing().run();
    return reply.status(204).send();
  });

  app.delete<{ Params: { placeId: string } }>("/favorites/places/:placeId", guard, async (req, reply) => {
    await db
      .delete(favoritePlace)
      .where(and(eq(favoritePlace.subject, subjectOf(req)), eq(favoritePlace.placeId, req.params.placeId)))
      .run();
    return reply.status(204).send();
  });

  app.post<{ Params: { eventId: string } }>("/favorites/events/:eventId", guard, async (req, reply) => {
    const target = await db.select({ id: event.id }).from(event).where(eq(event.id, req.params.eventId)).get();
    if (!target) return notFound(reply, "event");
    await db.insert(favoriteEvent).values({ subject: subjectOf(req), eventId: target.id }).onConflictDoNothing().run();
    return reply.status(204).send();
  });

  app.delete<{ Params: { eventId: string } }>("/favorites/events/:eventId", guard, async (req, reply) => {
    await db
      .delete(favoriteEvent)
      .where(and(eq(favoriteEvent.subject, subjectOf(req)), eq(favoriteEvent.eventId, req.params.eventId)))
      .run();
    return reply.status(204).send();
  });

  app.get("/notifications", guard, async (req, reply): Promise<InboxDto> => {
    reply.header("cache-control", "no-store");
    const subject = subjectOf(req);
    const rows = await db
      .select({
        id: notification.id,
        kind: notification.kind,
        createdAt: notification.createdAt,
        readAt: notification.readAt,
        eventId: notification.eventId,
        placeId: place.id,
        placeName: place.name,
      })
      .from(notification)
      .leftJoin(place, eq(place.id, notification.placeId))
      .where(eq(notification.subject, subject))
      .orderBy(desc(notification.createdAt))
      .limit(50)
      .all();

    // A reminder names its event; a new-event item names its batch's events.
    const links = rows.length
      ? await db
          .select({ notificationId: notificationEvent.notificationId, eventId: notificationEvent.eventId })
          .from(notificationEvent)
          .where(inArray(notificationEvent.notificationId, rows.map((r) => r.id)))
          .all()
      : [];
    const eventIds = [...new Set([...links.map((l) => l.eventId), ...rows.flatMap((r) => (r.eventId ? [r.eventId] : []))])];
    const events = eventIds.length
      ? await db
          .select({ id: event.id, title: event.title, startDate: event.startDate })
          .from(event)
          .where(inArray(event.id, eventIds))
          .all()
      : [];
    const byId = new Map(events.map((e) => [e.id, e]));

    const data: NotificationDto[] = rows.map((r) => ({
      id: r.id,
      kind: r.kind as NotificationDto["kind"],
      createdAt: r.createdAt,
      readAt: r.readAt,
      place: r.placeId ? { id: r.placeId, name: r.placeName! } : null,
      events: (r.eventId ? [r.eventId] : links.filter((l) => l.notificationId === r.id).map((l) => l.eventId))
        .flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []))
        .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    }));
    const unread = await db
      .select({ n: sql<number>`count(*)` })
      .from(notification)
      .where(and(eq(notification.subject, subject), isNull(notification.readAt)))
      .get();
    return { unread: unread?.n ?? 0, data };
  });

  app.post("/notifications/read", guard, async (req, reply) => {
    const parsed = markReadSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ code: "INVALID_BODY", message: parsed.error.message });
    const subject = subjectOf(req);
    const res = await db
      .update(notification)
      .set({ readAt: new Date().toISOString() })
      .where(
        and(
          eq(notification.subject, subject),
          isNull(notification.readAt),
          "ids" in parsed.data ? inArray(notification.id, parsed.data.ids) : undefined,
        ),
      )
      .run();
    return { read: res.changes };
  });
}
