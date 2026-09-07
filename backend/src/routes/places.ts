import type { FastifyInstance } from "fastify";
import { and, asc, eq, gte, inArray, lte, sql, getTableColumns } from "drizzle-orm";
import { randomUUID } from "crypto";
import { event, place } from "../db/schema.js";
import {
  createPlaceSchema,
  parseCsv,
  placeEventsQuerySchema,
  placesQuerySchema,
  type Event,
  type Place,
  type CreatePlaceInput,
} from "@public-resource-map/shared";
import { boundingBox } from "../lib/geo.js";
import { lensWindow } from "../lib/time.js";
import { rowToEvent } from "./event-mapper.js";

function rowToPlace(
  row: typeof place.$inferSelect & { upcomingEventCount?: number },
): Place {
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
    ...(row.upcomingEventCount === undefined
      ? {}
      : { upcomingEventCount: row.upcomingEventCount }),
  };
}

/**
 * Live, upcoming events at a place inside the lens window, as a correlated
 * scalar subquery. This is what lets a pin show "3 things on here" without the
 * map firing one request per pin.
 *
 * Built through the query builder rather than a raw `sql` template on purpose:
 * a hand-written template renders its columns unqualified, so `place_id = id`
 * silently resolves both sides to the subquery's own table and every count
 * comes back zero. The builder emits `"event"."place_id" = "place"."id"`.
 */
function upcomingCountExpr(db: FastifyInstance["db"], from: string, to: string) {
  const sub = db
    .select({ c: sql<number>`count(*)` })
    .from(event)
    .where(
      and(
        eq(event.placeId, place.id),
        eq(event.status, "live"),
        gte(event.startDate, from),
        lte(event.startDate, to),
      ),
    );
  return sql<number>`(${sub})`;
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

    const { city, lat, lng, radiusKm, category, lens, page, pageSize } = query.data;

    const { from, to } = lensWindow(lens);
    const eventCount = upcomingCountExpr(db, from, to);

    const conditions = [];
    if (city) conditions.push(eq(place.city, city));
    if (lat !== undefined && lng !== undefined) {
      const box = boundingBox(lat, lng, radiusKm);
      conditions.push(sql`${place.lat} BETWEEN ${box.minLat} AND ${box.maxLat}`);
      conditions.push(sql`${place.lng} BETWEEN ${box.minLng} AND ${box.maxLng}`);
    }

    const categories = parseCsv(category);
    if (categories.length === 1) conditions.push(eq(place.category, categories[0]!));
    else if (categories.length > 1) conditions.push(inArray(place.category, categories));

    // The timing lens removes places rather than dimming them — at city pin
    // density a dimmed pin is invisible (locked 2026-06-28 stress test).
    if (lens !== "all") conditions.push(sql`${eventCount} > 0`);

    const where = conditions.length
      ? sql.join(conditions, sql` AND `)
      : undefined;
    const offset = (page - 1) * pageSize;

    const [rows, countRows] = await Promise.all([
      db
        .select({ ...getTableColumns(place), upcomingEventCount: eventCount })
        .from(place)
        .where(where)
        .limit(pageSize)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(place).where(where),
    ]);

    return {
      data: rows.map(rowToPlace),
      total: countRows[0]?.count ?? 0,
      page,
      pageSize,
    };
  });

  /**
   * What is on at one place. This is the other half of the place panel: the
   * panel's identity block comes from `/places/:id`, its programme from here.
   * Upcoming and live only — a past or retracted event never reaches a user.
   */
  app.get<{ Params: { id: string }; Querystring: Record<string, string> }>(
    "/places/:id/events",
    async (req, reply) => {
      const query = placeEventsQuerySchema.safeParse(req.query);
      if (!query.success) {
        return reply
          .status(400)
          .send({ code: "INVALID_QUERY", message: query.error.message });
      }

      const exists = await db
        .select({ id: place.id })
        .from(place)
        .where(eq(place.id, req.params.id))
        .get();
      if (!exists) {
        return reply.status(404).send({ code: "NOT_FOUND", message: "Place not found" });
      }

      const { lens, limit } = query.data;
      const { from, to } = lensWindow(lens);

      const rows = await db
        .select()
        .from(event)
        .where(
          and(
            eq(event.placeId, req.params.id),
            eq(event.status, "live"),
            gte(event.startDate, from),
            lte(event.startDate, to),
          ),
        )
        .orderBy(asc(event.startDate))
        .limit(limit);

      const data: Event[] = rows.map(rowToEvent);
      return { data, total: data.length, page: 1, pageSize: limit };
    },
  );

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
