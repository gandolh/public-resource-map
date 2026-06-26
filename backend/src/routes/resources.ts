import type { FastifyInstance } from "fastify";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { z } from "zod";
import { db } from "../db/index.js";
import { resources } from "../db/schema.js";
import type { Resource, CreateResourceInput } from "@public-resource-map/shared";

const createResourceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.enum([
    "park", "library", "community_center", "healthcare",
    "education", "food", "shelter", "transport", "other",
  ]),
  address: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  website: z.string().url().optional(),
  phone: z.string().optional(),
  openingHours: z.string().optional(),
});

const nearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().min(0.1).max(100).default(5),
  category: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

function rowToResource(row: typeof resources.$inferSelect): Resource {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category as Resource["category"],
    address: row.address,
    coordinates: { lat: row.lat, lng: row.lng },
    website: row.website,
    phone: row.phone,
    openingHours: row.openingHours,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function resourceRoutes(app: FastifyInstance) {
  app.get<{ Querystring: Record<string, string> }>("/resources", async (req, reply) => {
    const query = nearbyQuerySchema.safeParse(req.query);
    if (!query.success) {
      return reply.status(400).send({ code: "INVALID_QUERY", message: query.error.message });
    }

    const { lat, lng, radiusKm, category, page, pageSize } = query.data;

    const latDelta = radiusKm / 111.0;
    const lngDelta = radiusKm / (111.0 * Math.cos((lat * Math.PI) / 180));

    const conditions = [
      sql`${resources.lat} BETWEEN ${lat - latDelta} AND ${lat + latDelta}`,
      sql`${resources.lng} BETWEEN ${lng - lngDelta} AND ${lng + lngDelta}`,
    ];

    if (category) {
      conditions.push(eq(resources.category, category));
    }

    const where = sql.join(conditions, sql` AND `);
    const offset = (page - 1) * pageSize;

    const [rows, countRows] = await Promise.all([
      db.select().from(resources).where(where).limit(pageSize).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(resources).where(where),
    ]);

    return {
      data: rows.map(rowToResource),
      total: countRows[0]?.count ?? 0,
      page,
      pageSize,
    };
  });

  app.get<{ Params: { id: string } }>("/resources/:id", async (req, reply) => {
    const row = await db
      .select()
      .from(resources)
      .where(eq(resources.id, req.params.id))
      .get();

    if (!row) return reply.status(404).send({ code: "NOT_FOUND", message: "Resource not found" });
    return rowToResource(row);
  });

  app.post<{ Body: CreateResourceInput }>("/resources", async (req, reply) => {
    const parsed = createResourceSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ code: "INVALID_BODY", message: parsed.error.message });
    }

    const { lat, lng, ...rest } = parsed.data;
    const id = randomUUID();

    await db.insert(resources).values({ id, lat, lng, ...rest });

    const row = await db.select().from(resources).where(eq(resources.id, id)).get();
    return reply.status(201).send(rowToResource(row!));
  });

  app.delete<{ Params: { id: string } }>("/resources/:id", async (req, reply) => {
    const result = await db.delete(resources).where(eq(resources.id, req.params.id));
    if (result.changes === 0) {
      return reply.status(404).send({ code: "NOT_FOUND", message: "Resource not found" });
    }
    return reply.status(204).send();
  });
}
