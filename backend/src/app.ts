import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import type BetterSqlite3 from "better-sqlite3";
import { createDb, type DB } from "./db/index.js";
import { placeRoutes } from "./routes/places.js";
import { adminOsmRoutes } from "./routes/admin-osm.js";
import { adminIngestRoutes } from "./routes/admin-ingest.js";
import { defaultIngestDeps, type IngestDeps } from "./ingest/pipeline.js";
import { eventRoutes } from "./routes/events.js";
import { whatsOnRoutes } from "./routes/whats-on.js";
import { favoriteRoutes } from "./routes/favorites.js";
import { archiveRoutes } from "./routes/archive.js";
import { registerAuth, type Auth } from "./ward/auth.js";
import { adoptWardSubjects } from "./ward/subjects.js";
import { WardUnavailableError, type WardClient } from "../vendor/ward/ward-auth.js";
import type { SyncDeps } from "./lib/osm-sync.js";
import { createMailSweeper, type MailSweeper } from "./lib/notify-mail.js";

declare module "fastify" {
  interface FastifyInstance {
    db: DB;
    /** prm's accounts and their Ward links (brief 24 of Ward's corpus). */
    auth: Auth;
    /** Notification email through Ward (brief 32): kicked after an accept and the daily sweep. */
    notifyMail: MailSweeper;
  }
}

export interface BuildAppOptions {
  /**
   * Inject a DB (e.g. a temp/in-memory one for tests), with the better-sqlite3
   * handle under it, where the accounts live. Defaults to the prod file DB.
   */
  db?: { db: DB; sqlite: BetterSqlite3.Database };
  logger?: boolean;
  /**
   * Inject a Ward client (a real one over a fake `fetch`), or `null` for none.
   * Left out, it is built from `WARD_OIDC_*`, and there is none without
   * `WARD_OIDC_ISSUER`. Sessions are real either way: a test signs in through
   * the library, and the real guard decides.
   */
  ward?: WardClient | null;
  /** `PUBLIC_ORIGIN`, for tests. */
  publicOrigin?: string;
  /**
   * Replace parts of event ingestion (brief 04): a test injects adapters, a
   * fake geocoder and a fixed clock, so nothing reaches a real source or
   * Nominatim.
   */
  ingest?: Partial<IngestDeps>;
  /** Replace the OSM sync's Overpass call (and its timeout) in tests. */
  osm?: SyncDeps;
}

/**
 * Build a Fastify app instance. The prod entrypoint (index.ts) calls this with
 * `logger: true` and the default DB; tests call it with an injected temp DB and
 * drive it via `app.inject()` — no network listen required.
 */
export async function buildApp(opts: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: opts.logger ?? false });

  const { db, sqlite } = opts.db ?? createDb();
  app.decorate("db", db);

  await app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    // The UI calls the API on its own origin (`/prm-api`, in development
    // through the dev server's proxy), so this matters only to a caller on
    // another origin; it never needs the session cookie.
    credentials: true,
  });

  /*
   * Accounts, before every route: the library's guard is a root `onRequest`
   * hook and refuses whatever `ward/auth.ts` does not list as public. The
   * admin routes add `requireRole("admin")` on top.
   */
  const auth = await registerAuth(app, {
    sqlite,
    wardClient: opts.ward,
    publicOrigin: opts.publicOrigin,
  });
  app.decorate("auth", auth);

  // Rows keyed by a Ward subject from before prm had users get a linked user
  // whose id is that subject. Skips what exists, so it runs on every boot.
  const adopted = await adoptWardSubjects(sqlite, auth.identities);
  if (adopted.created.length > 0) {
    app.log.info(`accounts: ${adopted.created.length} Ward subject(s) became local users`);
  }
  if (adopted.skipped.length > 0) {
    app.log.error({ subjects: adopted.skipped }, "accounts: no free placeholder name for these Ward subjects");
  }

  // Mail goes out in the background, never inside a request. Closing the app
  // waits for a sweep in flight, so a test never closes the database under it.
  // Only a Ward-linked user can be mailed: Ward holds the addresses. Without
  // Ward configured nothing is sent and the rows wait, as for an outage.
  const ward = auth.wardClient;
  const mail = createMailSweeper(
    app.db,
    (userId, message) =>
      ward
        ? auth.identities.notifyUser(ward, userId, message)
        : Promise.reject(new WardUnavailableError("Ward is not configured")),
    app.log,
  );
  app.decorate("notifyMail", mail);
  app.addHook("onClose", () => mail.idle());

  await app.register(placeRoutes, { prefix: "/api" });
  await app.register(adminOsmRoutes(opts.osm), { prefix: "/api" });
  await app.register(adminIngestRoutes({ ...defaultIngestDeps(), ...opts.ingest }), { prefix: "/api" });
  await app.register(eventRoutes, { prefix: "/api" });
  await app.register(whatsOnRoutes, { prefix: "/api" });
  await app.register(favoriteRoutes, { prefix: "/api" });
  await app.register(archiveRoutes, { prefix: "/api" });

  app.get("/health", async () => ({ status: "ok" }));

  return app;
}
