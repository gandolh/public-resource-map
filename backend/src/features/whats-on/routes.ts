import type { FastifyPluginAsyncZod } from "@fastify/type-provider-zod";
import { asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { event, place } from "../../db/schema.js";
import type { DB } from "../../db/index.js";
import { errorBodySchema } from "../../lib/api-error.js";
import { pageOf } from "../../lib/page.js";
import { parseCsv, whatsOnItemSchema, whatsOnQuerySchema, type WhatsOnItem } from "@public-resource-map/shared";
import { lensWindow } from "../../lib/time.js";
import { liveInWindow, rowToEvent } from "../events/index.js";

/** What this feature takes from the app's context. */
export interface Options {
  db: DB;
}

/**
 * `GET /api/whats-on` — the citywide, date-first lens on exactly the data the
 * map shows. It takes the same filters as the map (city, category chips, the
 * timing lens) so the two surfaces can never disagree, and every row carries
 * the place it happens at so the list can link back to a pin.
 *
 * This replaces the old event-centric `/events` grid as a *user* surface; the
 * `/events` route stays as a plain CRUD/proximity endpoint.
 */
export const whatsOnRoutes: FastifyPluginAsyncZod<Options> = async (app, { db }) => {
  const schema = {
    querystring: whatsOnQuerySchema,
    response: { 200: pageOf(whatsOnItemSchema), 400: errorBodySchema },
  };

  app.get("/whats-on", { schema }, async (req) => {
    const { city, category, lens, page, pageSize } = req.query;
    const { from, to } = lensWindow(lens);

    const conditions = [liveInWindow(from, to), isNull(place.retiredAt)];
    if (city) conditions.push(eq(place.city, city));

    const categories = parseCsv(category);
    if (categories.length > 0) conditions.push(inArray(place.category, categories));

    const where = sql.join(conditions, sql` AND `);
    const offset = (page - 1) * pageSize;

    const [rows, countRows] = await Promise.all([
      db
        .select()
        .from(event)
        .innerJoin(place, eq(event.placeId, place.id))
        .where(where)
        .orderBy(asc(event.startDate), asc(event.id))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(event)
        .innerJoin(place, eq(event.placeId, place.id))
        .where(where),
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

    return { data, total: countRows[0]?.count ?? 0, page, pageSize };
  });
};
