import type { FastifyInstance } from "fastify";
import type BetterSqlite3 from "better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { fileURLToPath } from "node:url";
import { createDb, type DB } from "../db/index.js";
import { buildApp } from "../app.js";
import { createFakeWard, type FakeWard } from "./fake-ward.js";

const migrationsFolder = fileURLToPath(new URL("../../drizzle", import.meta.url));

export interface TestApp {
  app: FastifyInstance;
  db: DB;
  sqlite: BetterSqlite3.Database;
  /**
   * The injected Ward client. Call `ward.signIn(token, subject, grants)` and
   * then send `cookie: ward_session=<token>` to make a request authenticated.
   * The real guards still decide what that session may do.
   */
  ward: FakeWard;
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
 */
export async function buildTestApp(): Promise<TestApp> {
  const { db, sqlite } = createDb(":memory:");
  migrate(db, { migrationsFolder });

  const ward = createFakeWard();
  const app = await buildApp({ db, logger: false, ward });
  await app.ready();

  return {
    app,
    db,
    sqlite,
    ward,
    close: async () => {
      await app.close();
      sqlite.close();
    },
  };
}
