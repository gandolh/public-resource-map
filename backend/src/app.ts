import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { createDb, type DB } from "./db/index.js";
import { placeRoutes } from "./routes/places.js";
import { adminOsmRoutes } from "./routes/admin-osm.js";
import { eventRoutes } from "./routes/events.js";
import { authRoutes } from "./routes/auth.js";
import { registerAuth } from "./plugins/auth.js";

declare module "fastify" {
  interface FastifyInstance {
    db: DB;
  }
}

export interface BuildAppOptions {
  /** Inject a DB (e.g. a temp/in-memory one for tests). Defaults to the prod file DB. */
  db?: DB;
  logger?: boolean;
}

/**
 * Build a Fastify app instance. The prod entrypoint (index.ts) calls this with
 * `logger: true` and the default DB; tests call it with an injected temp DB and
 * drive it via `app.inject()` — no network listen required.
 */
export async function buildApp(opts: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: opts.logger ?? false });

  app.decorate("db", opts.db ?? createDb().db);

  await app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    // Required so the browser sends + accepts the httpOnly session cookie
    // cross-origin (UI on :5173, API on :3001).
    credentials: true,
  });

  // Auth wiring on the root instance: `request.user`, the session-resolving
  // preHandler, and the `requireAuth`/`requireAdmin` guards — inherited by all
  // route plugins registered below (incl. `/api/admin/*` added by later briefs).
  await registerAuth(app);

  await app.register(placeRoutes, { prefix: "/api" });
  await app.register(adminOsmRoutes, { prefix: "/api" });
  await app.register(eventRoutes, { prefix: "/api" });
  await app.register(authRoutes, { prefix: "/api" });

  app.get("/health", async () => ({ status: "ok" }));

  return app;
}
