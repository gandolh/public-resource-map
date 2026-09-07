import type { FastifyInstance } from "fastify";
import { asc, eq, inArray, sql } from "drizzle-orm";
import { event, place } from "../db/schema.js";
import {
  parseCsv,
  whatsOnQuerySchema,
  type WhatsOnItem,
} from "@public-resource-map/shared";
import { lensWindow } from "../lib/time.js";
import { rowToEvent } from "./event-mapper.js";

/**
 * `GET /api/whats-on` — the citywide, date-first lens on exactly the data the
 * map shows. It takes the same filters as the map (city, category chips, the
 * timing lens) so the two surfaces can never disagree, and every row carries
 * the place it happens at so the list can link back to a pin.
 *
 * This replaces the old event-centric `/events` grid as a *user* surface; the
 * `/events` route stays as a plain CRUD/proximity endpoint.
 */
export async function whatsOnRoutes(app: FastifyInstance) {
  const db = app.db;

  app.get<{ Querystring: Record<string, string> }>("/whats-on", async (req, reply) => {
    const query = whatsOnQuerySchema.safeParse(req.query);
    if (!query.success) {
      return reply
        .status(400)
        .send({ code: "INVALID_QUERY", message: query.error.message });
    }

    const { city, category, lens, page, pageSize } = query.data;
    const { from, to } = lensWindow(lens);

    const conditions = [
      eq(event.status, "live"),
      sql`${event.startDate} >= ${from}`,
      sql`${event.startDate} <= ${to}`,
    ];
    if (city) conditions.push(eq(place.city, city));

    const categories = parseCsv(category);
    if (categories.length === 1) conditions.push(eq(place.category, categories[0]!));
    else if (categories.length > 1) conditions.push(inArray(place.category, categories));

    const where = sql.join(conditions, sql` AND `);
    const offset = (page - 1) * pageSize;

    const [rows, countRows] = await Promise.all([
      db
        .select()
        .from(event)
        .innerJoin(place, eq(event.placeId, place.id))
        .where(where)
        .orderBy(asc(event.startDate))
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
}
