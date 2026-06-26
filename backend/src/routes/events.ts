import type { FastifyInstance } from "fastify";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { z } from "zod";
import { db } from "../db/index.js";
import { events } from "../db/schema.js";
import type { Event, CreateEventInput } from "@public-resource-map/shared";

const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.enum([
    "concert", "theater", "sport", "community",
    "festival", "exhibition", "workshop", "other",
  ]),
  address: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  sourceUrl: z.string().url().optional(),
  sourcePlatform: z.string().optional(),
  imageUrl: z.string().url().optional(),
  price: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
});

const nearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().min(0.1).max(100).default(5),
  category: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

function rowToEvent(row: typeof events.$inferSelect): Event {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category as Event["category"],
    address: row.address,
    coordinates: { lat: row.lat, lng: row.lng },
    startDate: row.startDate,
    endDate: row.endDate,
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
  app.get<{ Querystring: Record<string, string> }>("/events", async (req, reply) => {
    const query = nearbyQuerySchema.safeParse(req.query);
    if (!query.success) {
      return reply.status(400).send({ code: "INVALID_QUERY", message: query.error.message });
    }

    const { lat, lng, radiusKm, category, from, to, page, pageSize } = query.data;

    const latDelta = radiusKm / 111.0;
    const lngDelta = radiusKm / (111.0 * Math.cos((lat * Math.PI) / 180));

    const conditions = [
      sql`${events.lat} BETWEEN ${lat - latDelta} AND ${lat + latDelta}`,
      sql`${events.lng} BETWEEN ${lng - lngDelta} AND ${lng + lngDelta}`,
    ];

    if (category) conditions.push(eq(events.category, category));
    if (from) conditions.push(sql`${events.startDate} >= ${from}`);
    if (to) conditions.push(sql`${events.startDate} <= ${to}`);

    const where = sql.join(conditions, sql` AND `);
    const offset = (page - 1) * pageSize;

    const [rows, countRows] = await Promise.all([
      db.select().from(events).where(where).limit(pageSize).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(events).where(where),
    ]);

    return {
      data: rows.map(rowToEvent),
      total: countRows[0]?.count ?? 0,
      page,
      pageSize,
    };
  });

  app.get<{ Params: { id: string } }>("/events/:id", async (req, reply) => {
    const row = await db
      .select()
      .from(events)
      .where(eq(events.id, req.params.id))
      .get();

    if (!row) return reply.status(404).send({ code: "NOT_FOUND", message: "Event not found" });
    return rowToEvent(row);
  });

  app.post<{ Body: CreateEventInput }>("/events", async (req, reply) => {
    const parsed = createEventSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ code: "INVALID_BODY", message: parsed.error.message });
    }

    const { lat, lng, ...rest } = parsed.data;
    const id = randomUUID();

    await db.insert(events).values({ id, lat, lng, ...rest });

    const row = await db.select().from(events).where(eq(events.id, id)).get();
    return reply.status(201).send(rowToEvent(row!));
  });

  app.delete<{ Params: { id: string } }>("/events/:id", async (req, reply) => {
    const result = await db.delete(events).where(eq(events.id, req.params.id));
    if (result.changes === 0) {
      return reply.status(404).send({ code: "NOT_FOUND", message: "Event not found" });
    }
    return reply.status(204).send();
  });
}
