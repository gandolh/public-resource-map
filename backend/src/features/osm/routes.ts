import type { FastifyPluginAsyncZod } from "@fastify/type-provider-zod";
import { osmSyncRequestSchema, osmSyncResultSchema } from "@public-resource-map/shared";
import { resolveCity, syncOsmForCity, type SyncDeps } from "./sync.js";
import type { DB } from "../../db/index.js";
import { errorBodySchema } from "../../lib/api-error.js";
import { requireRole, ROLES } from "../../plugins/auth/index.js";

/** What this feature takes from the app's context. */
export interface Options {
  db: DB;
  /** The Overpass call; a test passes a stub. */
  osm: SyncDeps;
}

const syncSchema = {
  body: osmSyncRequestSchema,
  response: {
    200: osmSyncResultSchema,
    400: errorBodySchema,
    // From the error plugin: a sync of this city already running, and an Overpass timeout.
    409: errorBodySchema,
    504: errorBodySchema,
  },
};

/**
 * Admin-gated OSM sync. Behind `requireRole("admin")` (401 anon, 403
 * non-admin). Runs an Overpass query for the requested city and upserts
 * `source:osm` places — never touches event-venue places or manual pins, and
 * never called on user traffic (ingest-once-into-SQLite, serve-from-DB).
 *
 * `osm` lets a test stub Overpass. A second sync of a city already syncing is
 * a 409, and an Overpass that does not answer in time a 504.
 */
export const adminOsmRoutes: FastifyPluginAsyncZod<Options> = async (app, { db, osm: deps }) => {
  app.post("/admin/osm/sync", { preValidation: requireRole(ROLES.admin), schema: syncSchema }, async (req, reply) => {
    const city = resolveCity(req.body.city);
    if (!city) {
      return reply.status(400).send({ code: "UNKNOWN_CITY", message: `Unknown city: ${req.body.city}` });
    }

    // A sync already running (409) and an Overpass timeout (504) are ApiErrors.
    return syncOsmForCity(db, city, deps);
  });
};
