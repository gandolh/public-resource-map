import type { FastifyInstance } from "fastify";
import type BetterSqlite3 from "better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { createDb, type DB } from "../db/index.js";
import { buildApp, type BuildAppOptions } from "../app.js";

const migrationsFolder = fileURLToPath(new URL("../../drizzle", import.meta.url));

/** The origin tests' apps believe they are served on. */
export const TEST_ORIGIN = "http://localhost:5173";

export interface SignedIn {
  /** The `cookie` header value: `prm_session=<token>`. */
  cookie: string;
  /** The local user id: what favourites and notifications are keyed by. */
  id: string;
}

export interface TestApp {
  app: FastifyInstance;
  db: DB;
  sqlite: BetterSqlite3.Database;
  /**
   * A local user with `role`, signed in, as a cookie header. A real session
   * from the shared library, so the real guard and `requireRole` decide what
   * it may do. Pass `id` to own rows a test already wrote under that key. No
   * password: a session is minted directly, which keeps scrypt out of tests
   * that are not about passwords.
   */
  signIn: (role?: "user" | "admin", id?: string) => Promise<SignedIn>;
  /** Close the Fastify app + the SQLite connection. Call in `afterAll`/`afterEach`. */
  close: () => Promise<void>;
}

/**
 * Spin up a Fastify app wired to a fresh **in-memory** SQLite DB with all
 * migrations applied — an isolated, ephemeral database per call. Drive it with
 * `app.inject(...)` (Fastify's built-in light-my-request; no real socket, no
 * supertest). Feature briefs (02/03/04/05) build their API integration tests
 * on top of this: seed via the returned `db`, assert via `app.inject`.
 *
 *   const { app, db, close } = await buildTestApp();
 *   await db.insert(place).values({ ... });
 *   const res = await app.inject({ method: "GET", url: "/api/resources?..." });
 *   ...
 *   await close();
 *
 * Ward is off unless a test passes a client (`ward`), and `before` runs on the
 * migrated database before the app boots, for tests of what boot does to
 * existing rows.
 */
export async function buildTestApp(
  opts: Pick<BuildAppOptions, "ingest" | "osm" | "ward"> & { before?: (db: DB) => void } = {},
): Promise<TestApp> {
  const { db, sqlite } = createDb(":memory:");
  migrate(db, { migrationsFolder });
  opts.before?.(db);

  const app = await buildApp({
    db: { db, sqlite },
    logger: false,
    ward: opts.ward ?? null,
    publicOrigin: TEST_ORIGIN,
    ingest: opts.ingest,
    osm: opts.osm,
  });
  await app.ready();

  return {
    app,
    db,
    sqlite,
    async signIn(role = "user", id = randomUUID()) {
      const { accounts } = app.auth;
      const user =
        (await accounts.findUserById(id)) ??
        (await accounts.createUser({ id, username: `${role}-${id}`, role }));
      const { token } = await accounts.startSession(user.id);
      return { cookie: `prm_session=${token}`, id: user.id };
    },
    close: async () => {
      await app.close();
      sqlite.close();
    },
  };
}
