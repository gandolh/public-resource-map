import type { FastifyPluginAsyncZod } from "@fastify/type-provider-zod";
import { and, eq, isNull, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { z } from "zod";
import { event, place } from "../../db/schema.js";
import type { DB } from "../../db/index.js";
import { createEventSchema, eventSchema, eventsQuerySchema } from "@public-resource-map/shared";
import { boundingBox } from "../../lib/geo.js";
import { rowToEvent } from "./mapper.js";
import { isForeignKeyViolation } from "../../lib/fk.js";
import { requireRole, ROLES } from "../../plugins/auth/index.js";
import { errorBodySchema } from "../../lib/api-error.js";
import { pageOf } from "../../lib/page.js";
import { idParamsSchema } from "../../lib/params.js";

/** What this feature takes from the app's context. */
export interface Options {
  db: DB;
}

export const eventRoutes: FastifyPluginAsyncZod<Options> = async (app, { db }) => {
  const listSchema = {
    querystring: eventsQuerySchema,
    response: { 200: pageOf(eventSchema), 400: errorBodySchema },
  };
  app.get("/events", { schema: listSchema }, async (req) => {
    const { lat, lng, radiusKm, category, from, to, page, pageSize } = req.query;

    const box = boundingBox(lat, lng, radiusKm);

    // Events attach to a place; proximity is filtered via the place's coords.
    const conditions = [
      isNull(place.retiredAt),
      sql`${place.lat} BETWEEN ${box.minLat} AND ${box.maxLat}`,
      sql`${place.lng} BETWEEN ${box.minLng} AND ${box.maxLng}`,
    ];

    if (category) conditions.push(eq(event.category, category));
    if (from) conditions.push(sql`${event.startDate} >= ${from}`);
    if (to) conditions.push(sql`${event.startDate} <= ${to}`);

    const where = sql.join(conditions, sql` AND `);
    const offset = (page - 1) * pageSize;

    const [rows, countRows] = await Promise.all([
      db.select().from(event).innerJoin(place, eq(event.placeId, place.id)).where(where).limit(pageSize).offset(offset),
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

  const oneSchema = { params: idParamsSchema, response: { 200: eventSchema, 404: errorBodySchema } };
  app.get("/events/:id", { schema: oneSchema }, async (req, reply) => {
    // An event at a retired place is hidden with it.
    const row = db
      .select({ event })
      .from(event)
      .innerJoin(place, eq(place.id, event.placeId))
      .where(and(eq(event.id, req.params.id), isNull(place.retiredAt)))
      .get();

    if (!row) return reply.status(404).send({ code: "NOT_FOUND", message: "Event not found" });
    return rowToEvent(row.event);
  });

  // Admin-only, like the place writes. Anonymous POSTs used to
  // publish straight to `live`, skipping the review gate.
  const createSchema = { body: createEventSchema, response: { 201: eventSchema, 400: errorBodySchema } };
  app.post("/events", { preValidation: requireRole(ROLES.admin), schema: createSchema }, async (req, reply) => {
    const id = randomUUID();

    await db.insert(event).values({ id, ...req.body });

    const row = db.select().from(event).where(eq(event.id, id)).get();
    if (!row) throw new Error(`Event ${id} was not found after its insert`);
    return reply.status(201).send(rowToEvent(row));
  });

  const deleteSchema = {
    params: idParamsSchema,
    response: { 204: z.null(), 404: errorBodySchema, 409: errorBodySchema },
  };
  app.delete("/events/:id", { preValidation: requireRole(ROLES.admin), schema: deleteSchema }, async (req, reply) => {
    let result;
    try {
      result = await db.delete(event).where(eq(event.id, req.params.id));
    } catch (err) {
      if (isForeignKeyViolation(err)) {
        return reply.status(409).send({ code: "EVENT_IN_USE", message: "Event is still referenced" });
      }
      throw err;
    }
    if (result.changes === 0) {
      return reply.status(404).send({ code: "NOT_FOUND", message: "Event not found" });
    }
    return reply.status(204).send(null);
  });
};
