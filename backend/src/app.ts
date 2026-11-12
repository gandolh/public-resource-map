import Fastify, { type FastifyInstance, type FastifyServerOptions } from "fastify";
import cors from "@fastify/cors";
import type BetterSqlite3 from "better-sqlite3";
import { createDb, type DB } from "./db/index.js";
import { errors } from "./plugins/errors.js";
import { registerAuth, type Auth } from "./plugins/auth/index.js";
import { adoptWardSubjects } from "./plugins/auth/subjects.js";
import { WardUnavailableError, type WardClient } from "../vendor/ward/ward-auth.js";
import type { Config } from "./config.js";
import { archiveRoutes } from "./features/archive/index.js";
import { eventRoutes } from "./features/events/index.js";
import { favoriteRoutes } from "./features/favorites/index.js";
import { adminIngestRoutes, defaultIngestDeps, type IngestDeps } from "./features/ingest/index.js";
import { notificationRoutes } from "./features/notifications/index.js";
import { adminOsmRoutes, overpassFetcher, type SyncDeps } from "./features/osm/index.js";
import { placeRoutes } from "./features/places/index.js";
import { createMailSweeper, type MailSweeper } from "./features/reminders/index.js";
import { whatsOnRoutes } from "./features/whats-on/index.js";

declare module "fastify" {
  interface FastifyInstance {
    db: DB;
    /** prm's accounts and their Ward links (since 2026-10-13). */
    auth: Auth;
    /** Notification email through Ward: kicked after an accept and the daily sweep. */
    notifyMail: MailSweeper;
  }
}

/** Fastify's options that belong to the process. server.ts sets them; a test leaves them out. */
type ServerOptions = Pick<
  FastifyServerOptions,
  "logger" | "trustProxy" | "connectionTimeout" | "requestTimeout" | "keepAliveTimeout"
>;

export interface BuildAppOptions {
  /**
   * Inject a DB (e.g. a temp/in-memory one for tests), with the better-sqlite3
   * handle under it, where the accounts live; its owner closes it. Left out,
   * the app opens `config.databasePath` and closes it when it closes.
   */
  db?: { db: DB; sqlite: BetterSqlite3.Database };
  server?: ServerOptions;
  /**
   * Inject a Ward client (a real one over a fake `fetch`), or `null` for none.
   * Left out, it is built from `config.ward`, and there is none without
   * `WARD_OIDC_ISSUER`. Sessions are real either way: a test signs in through
   * the library, and the real guard decides.
   */
  ward?: WardClient | null;
  /**
   * Replace parts of event ingestion: a test injects adapters, a
   * fake geocoder and a fixed clock, so nothing reaches a real source or
   * Nominatim.
   */
  ingest?: Partial<IngestDeps>;
  /** Replace the OSM sync's Overpass call (and its timeout) in tests. */
  osm?: Partial<SyncDeps>;
}

/**
 * Build a Fastify app instance, never listening. server.ts calls this with the
 * process's options (the logger, the timeouts, `trustProxy`); tests call it
 * with an injected temp DB and drive it via `app.inject()`.
 */
export async function buildApp(config: Config, opts: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify(opts.server);
  // First: the error and not-found handlers, on the root, before anything that can throw.
  await app.register(errors);

  const { db, sqlite } = opts.db ?? createDb(config.databasePath);
  app.decorate("db", db);

  await app.register(cors, {
    origin: config.corsOrigin,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    // The UI calls the API on its own origin (`/prm-api`, in development
    // through the dev server's proxy), so this matters only to a caller on
    // another origin; it never needs the session cookie.
    credentials: true,
  });

  /*
   * Accounts, before every route: the library's guard is a root `onRequest`
   * hook and refuses whatever `plugins/auth/index.ts` does not list as public. The
   * admin routes add `requireRole("admin")` on top.
   */
  const auth = await registerAuth(app, { sqlite, wardClient: opts.ward, config });
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
    config.appUrl,
  );
  app.decorate("notifyMail", mail);
  // One hook, in order: the mail in flight, then the database, if the app opened it.
  app.addHook("onClose", async () => {
    await mail.idle();
    if (!opts.db) sqlite.close();
  });

  await app.register(placeRoutes, { prefix: "/api" });
  await app.register(adminOsmRoutes({ fetchOverpass: overpassFetcher(config.overpassUrl), ...opts.osm }), {
    prefix: "/api",
  });
  await app.register(adminIngestRoutes({ ...defaultIngestDeps(config), ...opts.ingest }), { prefix: "/api" });
  await app.register(eventRoutes, { prefix: "/api" });
  await app.register(whatsOnRoutes, { prefix: "/api" });
  await app.register(favoriteRoutes, { prefix: "/api" });
  await app.register(notificationRoutes, { prefix: "/api" });
  await app.register(archiveRoutes, { prefix: "/api" });

  app.get("/health", async () => ({ status: "ok" }));

  return app;
}
