import type { FastifyInstance } from "fastify";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { z } from "zod";
import { event, place } from "../db/schema.js";
import {
  createEventSchema,
  nearbyQuerySchema,
  type Event,
  type CreateEventInput,
} from "@public-resource-map/shared";
import { boundingBox } from "../lib/geo.js";

const eventsQuerySchema = nearbyQuerySchema.extend({
  from: z.string().optional(),
  to: z.string().optional(),
});

function rowToEvent(row: typeof event.$inferSelect): Event {
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

export async function eventRoutes(app: FastifyInstance) {
  const db = app.db;

  app.get<{ Querystring: Record<string, string> }>("/events", async (req, reply) => {
    const query = eventsQuerySchema.safeParse(req.query);
    if (!query.success) {
      return reply.status(400).send({ code: "INVALID_QUERY", message: query.error.message });
    }

    const { lat, lng, radiusKm, category, from, to, page, pageSize } = query.data;

    const box = boundingBox(lat, lng, radiusKm);

    // Events attach to a place; proximity is filtered via the place's coords.
    const conditions = [
      sql`${place.lat} BETWEEN ${box.minLat} AND ${box.maxLat}`,
      sql`${place.lng} BETWEEN ${box.minLng} AND ${box.maxLng}`,
    ];

    if (category) conditions.push(eq(event.category, category));
    if (from) conditions.push(sql`${event.startDate} >= ${from}`);
    if (to) conditions.push(sql`${event.startDate} <= ${to}`);

    const where = sql.join(conditions, sql` AND `);
    const offset = (page - 1) * pageSize;

    const [rows, countRows] = await Promise.all([
      db
        .select()
        .from(event)
        .innerJoin(place, eq(event.placeId, place.id))
        .where(where)
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(event)
        .innerJoin(place, eq(event.placeId, place.id))
        .where(where),
    ]);

    return {
      data: rows.map((r) => rowToEvent(r.event)),
      total: countRows[0]?.count ?? 0,
      page,
      pageSize,
    };
  });

  app.get<{ Params: { id: string } }>("/events/:id", async (req, reply) => {
    const row = await db
      .select()
      .from(event)
      .where(eq(event.id, req.params.id))
      .get();

    if (!row) return reply.status(404).send({ code: "NOT_FOUND", message: "Event not found" });
    return rowToEvent(row);
  });

  app.post<{ Body: CreateEventInput }>("/events", async (req, reply) => {
    const parsed = createEventSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ code: "INVALID_BODY", message: parsed.error.message });
    }

    const id = randomUUID();

    await db.insert(event).values({ id, ...parsed.data });

    const row = await db.select().from(event).where(eq(event.id, id)).get();
    return reply.status(201).send(rowToEvent(row!));
  });

  app.delete<{ Params: { id: string } }>("/events/:id", async (req, reply) => {
    const result = await db.delete(event).where(eq(event.id, req.params.id));
    if (result.changes === 0) {
      return reply.status(404).send({ code: "NOT_FOUND", message: "Event not found" });
    }
    return reply.status(204).send();
  });
}
