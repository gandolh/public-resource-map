import type { FastifyInstance } from "fastify";
import {
  osmSyncRequestSchema,
  type OsmSyncRequest,
} from "@public-resource-map/shared";
import { resolveCity, syncOsmForCity } from "../lib/osm-sync.js";

/**
 * Admin-gated OSM sync (brief 03). Behind `requireAdmin` (401 anon, 403
 * non-admin). Runs an Overpass query for the requested city and upserts
 * `source:osm` places — never touches event-venue places or manual pins, and
 * never called on user traffic (ingest-once-into-SQLite, serve-from-DB).
 */
export async function adminOsmRoutes(app: FastifyInstance) {
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

      const result = await syncOsmForCity(db, city);
      return result;
    },
  );
}
