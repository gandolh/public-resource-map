import type { FastifyInstance, FastifyReply } from "fastify";
import { and, eq, isNull } from "drizzle-orm";
import type { FavoritesDto } from "@public-resource-map/shared";
import { subjectOf } from "../../plugins/auth/index.js";
import { event, favoriteEvent, favoritePlace, place } from "../../db/schema.js";
import type { DB } from "../../db/index.js";

/**
 * Favourites. Everything here is per person, keyed on
 * the local user id (the `subject` column; a migrated user's id is their Ward
 * subject), and signed-in only: none of it is on the public allowlist in
 * `plugins/auth/index.ts`. Adding and removing are idempotent, so a double tap or a
 * retried request leaves one row or none.
 */
/** What this feature takes from the app's context. */
export interface Options {
  db: DB;
}

export async function favoriteRoutes(app: FastifyInstance, { db }: Options) {
  const notFound = (reply: FastifyReply, what: string) =>
    reply.status(404).send({ code: "NOT_FOUND", message: `No such ${what}` });

  app.get("/favorites", async (req): Promise<FavoritesDto> => {
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

  app.post<{ Params: { placeId: string } }>("/favorites/places/:placeId", async (req, reply) => {
    const target = db
      .select({ id: place.id })
      .from(place)
      .where(and(eq(place.id, req.params.placeId), isNull(place.retiredAt)))
      .get();
    if (!target) return notFound(reply, "place");
    db.insert(favoritePlace)
      .values({ subject: subjectOf(req), placeId: target.id })
      .onConflictDoNothing()
      .run();
    return reply.status(204).send();
  });

  app.delete<{ Params: { placeId: string } }>("/favorites/places/:placeId", async (req, reply) => {
    db.delete(favoritePlace)
      .where(and(eq(favoritePlace.subject, subjectOf(req)), eq(favoritePlace.placeId, req.params.placeId)))
      .run();
    return reply.status(204).send();
  });

  app.post<{ Params: { eventId: string } }>("/favorites/events/:eventId", async (req, reply) => {
    const target = db.select({ id: event.id }).from(event).where(eq(event.id, req.params.eventId)).get();
    if (!target) return notFound(reply, "event");
    db.insert(favoriteEvent)
      .values({ subject: subjectOf(req), eventId: target.id })
      .onConflictDoNothing()
      .run();
    return reply.status(204).send();
  });

  app.delete<{ Params: { eventId: string } }>("/favorites/events/:eventId", async (req, reply) => {
    db.delete(favoriteEvent)
      .where(and(eq(favoriteEvent.subject, subjectOf(req)), eq(favoriteEvent.eventId, req.params.eventId)))
      .run();
    return reply.status(204).send();
  });
}
