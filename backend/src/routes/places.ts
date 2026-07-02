import type { FastifyInstance } from "fastify";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { place } from "../db/schema.js";
import {
  createPlaceSchema,
  placesQuerySchema,
  type Place,
  type CreatePlaceInput,
} from "@public-resource-map/shared";
import { boundingBox } from "../lib/geo.js";

function rowToPlace(row: typeof place.$inferSelect): Place {
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
  };
}

/**
 * Public places API (brief 03). Serves the map + place panel FAST from SQLite —
 * OSM data is ingested once (see `POST /api/admin/osm/sync`) and never fetched
 * from Overpass on user traffic. Renames the transitional `/api/resources`.
 */
export async function placeRoutes(app: FastifyInstance) {
  const db = app.db;

  app.get<{ Querystring: Record<string, string> }>("/places", async (req, reply) => {
    const query = placesQuerySchema.safeParse(req.query);
    if (!query.success) {
      return reply
        .status(400)
        .send({ code: "INVALID_QUERY", message: query.error.message });
    }

    const { city, lat, lng, radiusKm, category, page, pageSize } = query.data;

    const conditions = [];
    if (city) conditions.push(eq(place.city, city));
    if (lat !== undefined && lng !== undefined) {
      const box = boundingBox(lat, lng, radiusKm);
      conditions.push(sql`${place.lat} BETWEEN ${box.minLat} AND ${box.maxLat}`);
      conditions.push(sql`${place.lng} BETWEEN ${box.minLng} AND ${box.maxLng}`);
    }
    if (category) conditions.push(eq(place.category, category));

    const where = conditions.length
      ? sql.join(conditions, sql` AND `)
      : undefined;
    const offset = (page - 1) * pageSize;

    const [rows, countRows] = await Promise.all([
      db.select().from(place).where(where).limit(pageSize).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(place).where(where),
    ]);

    return {
      data: rows.map(rowToPlace),
      total: countRows[0]?.count ?? 0,
      page,
      pageSize,
    };
  });

  app.get<{ Params: { id: string } }>("/places/:id", async (req, reply) => {
    const row = await db
      .select()
      .from(place)
      .where(eq(place.id, req.params.id))
      .get();

    if (!row) return reply.status(404).send({ code: "NOT_FOUND", message: "Place not found" });
    return rowToPlace(row);
  });

  app.post<{ Body: CreatePlaceInput }>("/places", async (req, reply) => {
    const parsed = createPlaceSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ code: "INVALID_BODY", message: parsed.error.message });
    }

    const { lat, lng, ...rest } = parsed.data;
    const id = randomUUID();

    await db.insert(place).values({ id, lat, lng, ...rest });

    const row = await db.select().from(place).where(eq(place.id, id)).get();
    return reply.status(201).send(rowToPlace(row!));
  });

  app.delete<{ Params: { id: string } }>("/places/:id", async (req, reply) => {
    const result = await db.delete(place).where(eq(place.id, req.params.id));
    if (result.changes === 0) {
      return reply.status(404).send({ code: "NOT_FOUND", message: "Place not found" });
    }
    return reply.status(204).send();
  });
}
