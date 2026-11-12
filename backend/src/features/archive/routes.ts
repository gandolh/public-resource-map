import type { FastifyPluginAsyncZod } from "@fastify/type-provider-zod";
import { desc, eq, inArray, isNull, or, sql, type SQL } from "drizzle-orm";
import {
  archiveQuerySchema,
  parseCsv,
  whatsOnItemSchema,
  type ArchiveQuery,
  type SourceRegistry,
  type WhatsOnItem,
} from "@public-resource-map/shared";
import { event, favoriteEvent, favoritePlace, place } from "../../db/schema.js";
import type { DB } from "../../db/index.js";
import { errorBodySchema } from "../../lib/api-error.js";
import { pageOf } from "../../lib/page.js";
import { subjectOf } from "../../plugins/auth/index.js";
import { pastAt, rowToEvent } from "../events/index.js";
import { eventCredits, eventPublished, placePublished, publicationOf, type Publication } from "../sources/index.js";

/** What this feature takes from the app's context. */
export interface Options {
  db: DB;
  sources: SourceRegistry;
}

/** A page of past events, each with its place. */
const archiveSchema = {
  querystring: archiveQuerySchema,
  response: { 200: pageOf(whatsOnItemSchema), 400: errorBodySchema },
};

/**
 * The archive: events that happened, newest first. Past events are
 * kept rather than deleted (decisions.md → event horizon), and each row still
 * links to its place. The citywide list is public; "mine" (events you saved,
 * and events at places you follow) is yours alone.
 */
export const archiveRoutes: FastifyPluginAsyncZod<Options> = async (app, { db, sources }) => {
  const ended = sql`coalesce(${event.endDate}, ${event.startDate})`;

  async function page(conditions: SQL[], q: ArchiveQuery, publication: Publication) {
    // A forbidden source's events are held back here too, "mine" included.
    const where = sql.join(
      [...conditions, eventPublished(db, publication), placePublished(db, publication)].filter(
        (c): c is SQL => c !== undefined,
      ),
      sql` AND `,
    );
    const offset = (q.page - 1) * q.pageSize;
    const [rows, count] = [
      db
        .select()
        .from(event)
        .innerJoin(place, eq(event.placeId, place.id))
        .where(where)
        .orderBy(desc(ended), desc(event.id))
        .limit(q.pageSize)
        .offset(offset)
        .all(),
      db
        .select({ n: sql<number>`count(*)` })
        .from(event)
        .innerJoin(place, eq(event.placeId, place.id))
        .where(where)
        .get(),
    ];
    const credits = eventCredits(
      db,
      publication,
      rows.map((r) => r.event.id),
    );
    const data: WhatsOnItem[] = rows.map((r) => ({
      event: rowToEvent(r.event, credits.get(r.event.id) ?? null),
      place: {
        id: r.place.id,
        name: r.place.name,
        category: r.place.category as WhatsOnItem["place"]["category"],
        address: r.place.address,
        city: r.place.city,
        coordinates: { lat: r.place.lat, lng: r.place.lng },
        // Only "mine" can hold a retired place; it shows as no longer listed.
        ...(r.place.retiredAt ? { listed: false } : {}),
      },
    }));
    return { data, total: count?.n ?? 0, page: q.page, pageSize: q.pageSize };
  }

  const categoryFilter = (q: ArchiveQuery): SQL[] => {
    const categories = parseCsv(q.category);
    return categories.length ? [inArray(event.category, categories)] : [];
  };

  app.get("/archive", { schema: archiveSchema }, async (req) => {
    const q = req.query;
    // Public: a retired place's past events go with it.
    const conditions = [pastAt(new Date().toISOString()), isNull(place.retiredAt), ...categoryFilter(q)];
    if (q.city) conditions.push(eq(place.city, q.city));
    return page(conditions, q, publicationOf(db, sources));
  });

  // Signed-in only: not on the public allowlist (`plugins/auth/index.ts`).
  app.get("/archive/mine", { schema: archiveSchema }, async (req) => {
    const q = req.query;
    const subject = subjectOf(req);
    // What you saved, and what happened at places you follow.
    const saved = db
      .select({ id: favoriteEvent.eventId })
      .from(favoriteEvent)
      .where(eq(favoriteEvent.subject, subject));
    const followed = db
      .select({ id: favoritePlace.placeId })
      .from(favoritePlace)
      .where(eq(favoritePlace.subject, subject));
    const mine = or(inArray(event.id, saved), inArray(event.placeId, followed));
    if (!mine) throw new Error("or() of two conditions came back empty");
    const conditions = [pastAt(new Date().toISOString()), mine, ...categoryFilter(q)];
    return page(conditions, q, publicationOf(db, sources));
  });
};
