import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { createDb, type DB } from "./db/index.js";
import { placeRoutes } from "./routes/places.js";
import { adminOsmRoutes } from "./routes/admin-osm.js";
import { eventRoutes } from "./routes/events.js";
import { whatsOnRoutes } from "./routes/whats-on.js";
import { meRoutes } from "./routes/me.js";
import { registerWard } from "./ward/ward.plugin.js";
import { wardConfig } from "./ward/config.js";
import type { WardClient } from "./ward/ward.client.js";

declare module "fastify" {
  interface FastifyInstance {
    db: DB;
  }
}

export interface BuildAppOptions {
  /** Inject a DB (e.g. a temp/in-memory one for tests). Defaults to the prod file DB. */
  db?: DB;
  logger?: boolean;
  /**
   * Inject a Ward client, so a test can decide who is signed in without a real
   * Ward, a real signing key, or a network.
   *
   * The seam is the **client**, not the guards, on purpose: a test that stubbed
   * `requireAuth` would prove nothing about the thing most worth proving here,
   * which is that the guards read grants correctly. With this, a test supplies
   * a session and the real guards decide.
   */
  ward?: WardClient;
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
    // Required so the browser sends Ward's session cookie cross-origin
    // (UI on :5173, API on :3001 in development). prm sets no cookie of its
    // own any more, but it still has to *receive* Ward's.
    credentials: true,
  });

  /*
   * Ward wiring on the root instance: `request.ward`, the session-resolving
   * preHandler, and the `requireAuth`/`requireAdmin` guards — inherited by all
   * route plugins registered below.
   *
   * Nothing is gated by this call. prm is a **public** resource map and stays
   * one: the hook resolves a session when a cookie is present and leaves the
   * request anonymous otherwise, and the guards are opt-in per route. See
   * `ward/ward.plugin.ts`.
   */
  await registerWard(
    app,
    // The environment is read only when a real client is going to be built.
    // See `ward/config.ts` on why this is lazy rather than validated at import.
    opts.ward
      ? { publicOrigin: "", apiBasePath: "", appKey: "", client: opts.ward }
      : wardConfig(),
  );

  await app.register(placeRoutes, { prefix: "/api" });
  await app.register(adminOsmRoutes, { prefix: "/api" });
  await app.register(eventRoutes, { prefix: "/api" });
  await app.register(whatsOnRoutes, { prefix: "/api" });
  await app.register(meRoutes, { prefix: "/api" });

  app.get("/health", async () => ({ status: "ok" }));

  return app;
}
