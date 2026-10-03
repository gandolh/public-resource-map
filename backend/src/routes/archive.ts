import type { FastifyInstance, FastifyReply } from "fastify";
import { desc, eq, inArray, or, sql, type SQL } from "drizzle-orm";
import { archiveQuerySchema, parseCsv, type ArchiveQuery, type WhatsOnItem } from "@public-resource-map/shared";
import { event, favoriteEvent, favoritePlace, place } from "../db/schema.js";
import { rowToEvent } from "./event-mapper.js";
import { pastAt } from "./event-window.js";

/**
 * The archive (brief 14): events that happened, newest first. Past events are
 * kept rather than deleted (decisions.md → event horizon), and each row still
 * links to its place. The citywide list is public; "mine" (events you saved,
 * and events at places you follow) is yours alone.
 */
export async function archiveRoutes(app: FastifyInstance) {
  const db = app.db;
  const ended = sql`coalesce(${event.endDate}, ${event.startDate})`;

  async function page(where: SQL, q: ArchiveQuery) {
    const offset = (q.page - 1) * q.pageSize;
    const [rows, count] = await Promise.all([
      db
        .select()
        .from(event)
        .innerJoin(place, eq(event.placeId, place.id))
        .where(where)
        .orderBy(desc(ended), desc(event.id))
        .limit(q.pageSize)
        .offset(offset),
      db
        .select({ n: sql<number>`count(*)` })
        .from(event)
        .innerJoin(place, eq(event.placeId, place.id))
        .where(where)
        .get(),
    ]);
    const data: WhatsOnItem[] = rows.map((r) => ({
      event: rowToEvent(r.event),
      place: {
        id: r.place.id,
        name: r.place.name,
        category: r.place.category as WhatsOnItem["place"]["category"],
        address: r.place.address,
        city: r.place.city,
        coordinates: { lat: r.place.lat, lng: r.place.lng },
      },
    }));
    return { data, total: count?.n ?? 0, page: q.page, pageSize: q.pageSize };
  }

  const parse = (query: unknown, reply: FastifyReply) => {
    const parsed = archiveQuerySchema.safeParse(query);
    if (!parsed.success) {
      void reply.status(400).send({ code: "INVALID_QUERY", message: parsed.error.message });
      return null;
    }
    return parsed.data;
  };

  const categoryFilter = (q: ArchiveQuery): SQL[] => {
    const categories = parseCsv(q.category);
    return categories.length ? [inArray(event.category, categories)] : [];
  };

  app.get("/archive", async (req, reply) => {
    const q = parse(req.query, reply);
    if (!q) return reply;
    const conditions = [pastAt(new Date().toISOString()), ...categoryFilter(q)];
    if (q.city) conditions.push(eq(place.city, q.city));
    return page(sql.join(conditions, sql` AND `), q);
  });

  app.get("/archive/mine", { preHandler: app.requireAuth }, async (req, reply) => {
    const q = parse(req.query, reply);
    if (!q) return reply;
    const subject = req.ward!.subject;
    // What you saved, and what happened at places you follow.
    const saved = db.select({ id: favoriteEvent.eventId }).from(favoriteEvent).where(eq(favoriteEvent.subject, subject));
    const followed = db.select({ id: favoritePlace.placeId }).from(favoritePlace).where(eq(favoritePlace.subject, subject));
    const conditions = [
      pastAt(new Date().toISOString()),
      or(inArray(event.id, saved), inArray(event.placeId, followed))!,
      ...categoryFilter(q),
    ];
    return page(sql.join(conditions, sql` AND `), q);
  });
}
