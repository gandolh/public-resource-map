import type { FastifyPluginAsyncZod } from "@fastify/type-provider-zod";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { markReadSchema, type InboxDto, type NotificationDto } from "@public-resource-map/shared";
import { subjectOf } from "../../plugins/auth/index.js";
import { event, notification, notificationEvent, place } from "../../db/schema.js";
import type { DB } from "../../db/index.js";
import { errorBodySchema } from "../../lib/api-error.js";

/** `GET /api/notifications`: the newest 50 items, and how many are unread. */
const inboxSchema: z.ZodType<InboxDto> = z.object({
  unread: z.number(),
  data: z.array(
    z.object({
      id: z.string(),
      kind: z.enum(["new-event", "reminder"]),
      createdAt: z.string(),
      readAt: z.string().nullable(),
      place: z.object({ id: z.string(), name: z.string(), listed: z.boolean() }).nullable(),
      events: z.array(z.object({ id: z.string(), title: z.string(), startDate: z.string() })),
    }),
  ),
});

/**
 * The inbox: per person, keyed on the local user id (the `subject` column), and signed-in only:
 * none of it is on the public allowlist in `plugins/auth/index.ts`.
 */
/** What this feature takes from the app's context. */
export interface Options {
  db: DB;
}

export const notificationRoutes: FastifyPluginAsyncZod<Options> = async (app, { db }) => {
  app.get("/notifications", { schema: { response: { 200: inboxSchema } } }, async (req, reply) => {
    reply.header("cache-control", "no-store");
    const subject = subjectOf(req);
    const rows = db
      .select({
        id: notification.id,
        kind: notification.kind,
        createdAt: notification.createdAt,
        readAt: notification.readAt,
        eventId: notification.eventId,
        placeId: place.id,
        placeName: place.name,
        placeRetiredAt: place.retiredAt,
      })
      .from(notification)
      .leftJoin(place, eq(place.id, notification.placeId))
      .where(eq(notification.subject, subject))
      .orderBy(desc(notification.createdAt))
      .limit(50)
      .all();

    // A reminder names its event; a new-event item names its batch's events.
    const links = rows.length
      ? db
          .select({ notificationId: notificationEvent.notificationId, eventId: notificationEvent.eventId })
          .from(notificationEvent)
          .where(
            inArray(
              notificationEvent.notificationId,
              rows.map((r) => r.id),
            ),
          )
          .all()
      : [];
    const eventIds = [
      ...new Set([...links.map((l) => l.eventId), ...rows.flatMap((r) => (r.eventId ? [r.eventId] : []))]),
    ];
    const events = eventIds.length
      ? db
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
      // A followed place OSM dropped is named, not linked.
      place:
        r.placeId && r.placeName !== null
          ? { id: r.placeId, name: r.placeName, listed: r.placeRetiredAt === null }
          : null,
      events: (r.eventId ? [r.eventId] : links.filter((l) => l.notificationId === r.id).map((l) => l.eventId))
        .flatMap((id) => {
          const linked = byId.get(id);
          return linked ? [linked] : [];
        })
        .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    }));
    const unread = db
      .select({ n: sql<number>`count(*)` })
      .from(notification)
      .where(and(eq(notification.subject, subject), isNull(notification.readAt)))
      .get();
    return { unread: unread?.n ?? 0, data };
  });

  app.post(
    "/notifications/read",
    {
      schema: {
        body: markReadSchema,
        response: { 200: z.object({ read: z.number() }), 400: errorBodySchema },
      },
    },
    async (req) => {
      const input = req.body;
      const subject = subjectOf(req);
      const res = db
        .update(notification)
        .set({ readAt: new Date().toISOString() })
        .where(
          and(
            eq(notification.subject, subject),
            isNull(notification.readAt),
            "ids" in input ? inArray(notification.id, input.ids) : undefined,
          ),
        )
        .run();
      return { read: res.changes };
    },
  );
};
