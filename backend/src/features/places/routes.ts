import type { FastifyPluginAsyncZod } from "@fastify/type-provider-zod";
import { z } from "zod";
import { and, asc, eq, inArray, isNull, sql, getTableColumns, type SQL } from "drizzle-orm";
import { randomUUID } from "crypto";
import { event, place } from "../../db/schema.js";
import type { DB } from "../../db/index.js";
import {
  createPlaceSchema,
  parseCsv,
  placeEventsQuerySchema,
  placesQuerySchema,
  eventSchema,
  placeSchema,
  type SourceRegistry,
} from "@public-resource-map/shared";
import { boundingBox } from "../../lib/geo.js";
import { lensWindow } from "../../lib/time.js";
import { liveInWindow, rowToEvent } from "../events/index.js";
import { rowToPlace } from "./mapper.js";
import { isForeignKeyViolation } from "../../lib/fk.js";
import { requireRole, ROLES } from "../../plugins/auth/index.js";
import { errorBodySchema } from "../../lib/api-error.js";
import { pageOf } from "../../lib/page.js";
import { idParamsSchema } from "../../lib/params.js";
import { eventCredits, eventPublished, placeCredits, placePublished, publicationOf } from "../sources/index.js";

/**
 * Live events at a place that are on during the lens window (starting in it, or
 * already running through it: see `liveInWindow`), as a correlated
 * scalar subquery. This is what lets a pin show "3 things on here" without the
 * map firing one request per pin.
 *
 * Built through the query builder rather than a raw `sql` template on purpose:
 * a hand-written template renders its columns unqualified, so `place_id = id`
 * silently resolves both sides to the subquery's own table and every count
 * comes back zero. The builder emits `"event"."place_id" = "place"."id"`.
 */
function upcomingCountExpr(db: DB, from: string, to: string, published: SQL | undefined) {
  const sub = db
    .select({ c: sql<number>`count(*)` })
    .from(event)
    .where(and(eq(event.placeId, place.id), liveInWindow(from, to), published));
  return sql<number>`(${sub})`;
}

/** What this feature takes from the app's context. */
export interface Options {
  db: DB;
  sources: SourceRegistry;
}

/**
 * Public places API. Serves the map + place panel FAST from SQLite —
 * OSM data is ingested once (see `POST /api/admin/osm/sync`) and never fetched
 * from Overpass on user traffic. Renames the transitional `/api/resources`.
 */
export const placeRoutes: FastifyPluginAsyncZod<Options> = async (app, { db, sources }) => {
  /** The places as the API answers them, each with its credits. */
  const toPlaces = (rows: Parameters<typeof rowToPlace>[0][], publication = publicationOf(db, sources)) => {
    const credits = placeCredits(db, publication, rows);
    return rows.map((r) => rowToPlace(r, credits.get(r.id) ?? []));
  };

  const listSchema = {
    querystring: placesQuerySchema,
    response: { 200: pageOf(placeSchema), 400: errorBodySchema },
  };
  app.get("/places", { schema: listSchema }, async (req) => {
    const { city, lat, lng, radiusKm, category, lens, page, pageSize } = req.query;

    const { from, to } = lensWindow(lens);
    const publication = publicationOf(db, sources);
    const eventCount = upcomingCountExpr(db, from, to, eventPublished(db, publication));

    // A retired place (OSM no longer has it) is on no public surface, and neither is a place
    // whose source the registry forbids.
    const conditions = [isNull(place.retiredAt)];
    const shown = placePublished(db, publication);
    if (shown) conditions.push(shown);
    if (city) conditions.push(eq(place.city, city));
    if (lat !== undefined && lng !== undefined) {
      const box = boundingBox(lat, lng, radiusKm);
      conditions.push(sql`${place.lat} BETWEEN ${box.minLat} AND ${box.maxLat}`);
      conditions.push(sql`${place.lng} BETWEEN ${box.minLng} AND ${box.maxLng}`);
    }

    const categories = parseCsv(category);
    if (categories.length > 0) conditions.push(inArray(place.category, categories));

    // The timing lens removes places rather than dimming them — at city pin
    // density a dimmed pin is invisible (locked 2026-06-28 stress test).
    if (lens !== "all") conditions.push(sql`${eventCount} > 0`);

    const where = sql.join(conditions, sql` AND `);
    const offset = (page - 1) * pageSize;

    const [rows, countRows] = await Promise.all([
      db
        .select({ ...getTableColumns(place), upcomingEventCount: eventCount })
        .from(place)
        .where(where)
        // A total order, so pages are disjoint and repeatable: without it SQLite
        // returns scan order and offset paging can overlap or skip.
        .orderBy(asc(place.id))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(place)
        .where(where),
    ]);

    return {
      data: toPlaces(rows, publication),
      total: countRows[0]?.count ?? 0,
      page,
      pageSize,
    };
  });

  /**
   * What is on at one place. This is the other half of the place panel: the
   * panel's identity block comes from `/places/:id`, its programme from here.
   * Live and not yet over (upcoming, or running now) — a past or retracted
   * event never reaches a user.
   */
  const eventsSchema = {
    params: idParamsSchema,
    querystring: placeEventsQuerySchema,
    response: { 200: pageOf(eventSchema), 400: errorBodySchema, 404: errorBodySchema },
  };
  app.get("/places/:id/events", { schema: eventsSchema }, async (req, reply) => {
    const publication = publicationOf(db, sources);
    const exists = db
      .select({ id: place.id })
      .from(place)
      .where(and(eq(place.id, req.params.id), isNull(place.retiredAt), placePublished(db, publication)))
      .get();
    if (!exists) {
      return reply.status(404).send({ code: "NOT_FOUND", message: "Place not found" });
    }

    const { lens, limit } = req.query;
    const { from, to } = lensWindow(lens);

    const rows = await db
      .select()
      .from(event)
      .where(and(eq(event.placeId, req.params.id), liveInWindow(from, to), eventPublished(db, publication)))
      .orderBy(asc(event.startDate))
      .limit(limit);

    const credits = eventCredits(
      db,
      publication,
      rows.map((r) => r.id),
    );
    const data = rows.map((r) => rowToEvent(r, credits.get(r.id) ?? null));
    return { data, total: data.length, page: 1, pageSize: limit };
  });

  const oneSchema = { params: idParamsSchema, response: { 200: placeSchema, 404: errorBodySchema } };
  app.get("/places/:id", { schema: oneSchema }, async (req, reply) => {
    const publication = publicationOf(db, sources);
    const row = db
      .select()
      .from(place)
      .where(and(eq(place.id, req.params.id), isNull(place.retiredAt), placePublished(db, publication)))
      .get();

    if (!row) return reply.status(404).send({ code: "NOT_FOUND", message: "Place not found" });
    return toPlaces([row], publication)[0];
  });

  // The write routes are admin-only: they were open to anyone, so
  // a curl could delete every place or publish an unreviewed event. Kept, not
  // removed, as an escape hatch for manual fixes until the admin UI exists.
  const createSchema = { body: createPlaceSchema, response: { 201: placeSchema, 400: errorBodySchema } };
  app.post("/places", { preValidation: requireRole(ROLES.admin), schema: createSchema }, async (req, reply) => {
    const { lat, lng, ...rest } = req.body;
    const id = randomUUID();

    await db.insert(place).values({ id, lat, lng, ...rest });

    const row = db.select().from(place).where(eq(place.id, id)).get();
    if (!row) throw new Error(`Place ${id} was not found after its insert`);
    return reply.status(201).send(toPlaces([row])[0]);
  });

  const deleteSchema = {
    params: idParamsSchema,
    response: { 204: z.null(), 404: errorBodySchema, 409: errorBodySchema },
  };
  app.delete("/places/:id", { preValidation: requireRole(ROLES.admin), schema: deleteSchema }, async (req, reply) => {
    let result;
    try {
      result = await db.delete(place).where(eq(place.id, req.params.id));
    } catch (err) {
      // Still referenced by an event, a staged event, a favorite or a
      // notification: a refusal, not a 500.
      if (isForeignKeyViolation(err)) {
        return reply.status(409).send({ code: "PLACE_IN_USE", message: "Place is still referenced" });
      }
      throw err;
    }
    if (result.changes === 0) {
      return reply.status(404).send({ code: "NOT_FOUND", message: "Place not found" });
    }
    return reply.status(204).send(null);
  });
};
