import type { FastifyInstance } from "fastify";
import { osmSyncRequestSchema, type OsmSyncRequest } from "@public-resource-map/shared";
import { resolveCity, syncOsmForCity, type SyncDeps } from "./sync.js";
import type { DB } from "../../db/index.js";
import { requireRole, ROLES } from "../../plugins/auth/index.js";

/**
 * Admin-gated OSM sync. Behind `requireRole("admin")` (401 anon, 403
 * non-admin). Runs an Overpass query for the requested city and upserts
 * `source:osm` places — never touches event-venue places or manual pins, and
 * never called on user traffic (ingest-once-into-SQLite, serve-from-DB).
 *
 * `deps` lets a test stub Overpass. A second sync of a city already syncing is
 * a 409, and an Overpass that does not answer in time a 504.
 */
/** What this feature takes from the app's context. */
export interface Options {
  db: DB;
  /** The Overpass call; a test passes a stub. */
  osm: SyncDeps;
}

export async function adminOsmRoutes(app: FastifyInstance, { db, osm: deps }: Options) {
  app.post<{ Body: OsmSyncRequest }>(
    "/admin/osm/sync",
    { preHandler: requireRole(ROLES.admin) },
    async (req, reply) => {
      const parsed = osmSyncRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({ code: "INVALID_BODY", message: parsed.error.message });
      }

      const city = resolveCity(parsed.data.city);
      if (!city) {
        return reply.status(400).send({
          code: "UNKNOWN_CITY",
          message: `Unknown city: ${parsed.data.city}`,
        });
      }

      // A sync already running (409) and an Overpass timeout (504) are ApiErrors.
      return syncOsmForCity(db, city, deps);
    },
  );
}
