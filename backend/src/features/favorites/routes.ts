import type { FastifyPluginAsyncZod } from "@fastify/type-provider-zod";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import type { FavoritesDto } from "@public-resource-map/shared";
import { subjectOf } from "../../plugins/auth/index.js";
import { event, favoriteEvent, favoritePlace, place } from "../../db/schema.js";
import type { DB } from "../../db/index.js";
import { errorBodySchema } from "../../lib/api-error.js";

/** What this feature takes from the app's context. */
export interface Options {
  db: DB;
}

/** `GET /api/favorites`: the ids a person follows and saved. */
const favoritesSchema: z.ZodType<FavoritesDto> = z.object({
  places: z.array(z.string()),
  events: z.array(z.string()),
});

/** Any id: an unknown one is the handler's 404. */
const placeParamsSchema = z.object({ placeId: z.string() });
const eventParamsSchema = z.object({ eventId: z.string() });

/** Adding: nothing to send, or the target is gone. */
const addResponse = { 204: z.null(), 404: errorBodySchema };
/** Removing is idempotent: always 204. */
const removeResponse = { 204: z.null() };

/**
 * Favourites. Everything here is per person, keyed on
 * the local user id (the `subject` column; a migrated user's id is their Ward
 * subject), and signed-in only: none of it is on the public allowlist in
 * `plugins/auth/index.ts`. Adding and removing are idempotent, so a double tap or a
 * retried request leaves one row or none.
 */
export const favoriteRoutes: FastifyPluginAsyncZod<Options> = async (app, { db }) => {
  const notFound = (what: string) => ({ code: "NOT_FOUND", message: `No such ${what}` });

  app.get("/favorites", { schema: { response: { 200: favoritesSchema } } }, async (req) => {
    const subject = subjectOf(req);
    const places = db
      .select({ id: favoritePlace.placeId })
      .from(favoritePlace)
      .where(eq(favoritePlace.subject, subject))
      .all();
    const events = db
      .select({ id: favoriteEvent.eventId })
      .from(favoriteEvent)
      .where(eq(favoriteEvent.subject, subject))
      .all();
    return { places: places.map((p) => p.id), events: events.map((e) => e.id) };
  });

  app.post(
    "/favorites/places/:placeId",
    { schema: { params: placeParamsSchema, response: addResponse } },
    async (req, reply) => {
      const target = db
        .select({ id: place.id })
        .from(place)
        .where(and(eq(place.id, req.params.placeId), isNull(place.retiredAt)))
        .get();
      if (!target) return reply.status(404).send(notFound("place"));
      db.insert(favoritePlace)
        .values({ subject: subjectOf(req), placeId: target.id })
        .onConflictDoNothing()
        .run();
      return reply.status(204).send(null);
    },
  );

  app.delete(
    "/favorites/places/:placeId",
    { schema: { params: placeParamsSchema, response: removeResponse } },
    async (req, reply) => {
      db.delete(favoritePlace)
        .where(and(eq(favoritePlace.subject, subjectOf(req)), eq(favoritePlace.placeId, req.params.placeId)))
        .run();
      return reply.status(204).send(null);
    },
  );

  app.post(
    "/favorites/events/:eventId",
    { schema: { params: eventParamsSchema, response: addResponse } },
    async (req, reply) => {
      const target = db.select({ id: event.id }).from(event).where(eq(event.id, req.params.eventId)).get();
      if (!target) return reply.status(404).send(notFound("event"));
      db.insert(favoriteEvent)
        .values({ subject: subjectOf(req), eventId: target.id })
        .onConflictDoNothing()
        .run();
      return reply.status(204).send(null);
    },
  );

  app.delete(
    "/favorites/events/:eventId",
    { schema: { params: eventParamsSchema, response: removeResponse } },
    async (req, reply) => {
      db.delete(favoriteEvent)
        .where(and(eq(favoriteEvent.subject, subjectOf(req)), eq(favoriteEvent.eventId, req.params.eventId)))
        .run();
      return reply.status(204).send(null);
    },
  );
};
