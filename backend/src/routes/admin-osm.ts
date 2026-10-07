import type { FastifyInstance } from "fastify";
import {
  osmSyncRequestSchema,
  type OsmSyncRequest,
} from "@public-resource-map/shared";
import {
  OverpassTimeoutError,
  SyncInProgressError,
  resolveCity,
  syncOsmForCity,
  type SyncDeps,
} from "../lib/osm-sync.js";

/**
 * Admin-gated OSM sync (brief 03). Behind `requireAdmin` (401 anon, 403
 * non-admin). Runs an Overpass query for the requested city and upserts
 * `source:osm` places — never touches event-venue places or manual pins, and
 * never called on user traffic (ingest-once-into-SQLite, serve-from-DB).
 *
 * `deps` lets a test stub Overpass. A second sync of a city already syncing is
 * a 409, and an Overpass that does not answer in time a 504 (brief 33).
 */
export function adminOsmRoutes(deps: SyncDeps = {}) {
  return async function (app: FastifyInstance) {
    const db = app.db;

    app.post<{ Body: OsmSyncRequest }>(
      "/admin/osm/sync",
      { preHandler: app.requireAdmin },
      async (req, reply) => {
        const parsed = osmSyncRequestSchema.safeParse(req.body);
        if (!parsed.success) {
          return reply
            .status(400)
            .send({ code: "INVALID_BODY", message: parsed.error.message });
        }

        const city = resolveCity(parsed.data.city);
        if (!city) {
          return reply.status(400).send({
            code: "UNKNOWN_CITY",
            message: `Unknown city: ${parsed.data.city}`,
          });
        }

        try {
          return await syncOsmForCity(db, city, deps);
        } catch (err) {
          if (err instanceof SyncInProgressError) {
            return reply.status(409).send({ code: "SYNC_IN_PROGRESS", message: err.message });
          }
          if (err instanceof OverpassTimeoutError) {
            return reply.status(504).send({ code: "OVERPASS_TIMEOUT", message: err.message });
          }
          throw err;
        }
      },
    );
  };
}
