import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import * as schema from "./schema.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// DATABASE_PATH lets a deploy keep the sqlite file outside the rsynced source
// tree (so redeploys never wipe it); falls back to the in-repo default.
const defaultDbPath =
  process.env.DATABASE_PATH ?? path.resolve(__dirname, "../../data/app.db");

/**
 * Create a Drizzle DB bound to a fresh better-sqlite3 connection.
 * Prod opens the default file DB; tests pass ":memory:" or a temp path so the
 * app factory (see app.ts) can be driven with Fastify `.inject()` against an
 * isolated database. Kept as a factory (not a top-level singleton) so importing
 * the app in a test never opens the production DB file.
 */
export type DB = BetterSQLite3Database<typeof schema>;

export function createDb(dbPath: string = defaultDbPath): {
  db: DB;
  sqlite: Database.Database;
} {
  const sqlite = new Database(dbPath);
  // Brief 12. WAL lets readers run while the admin refresh writes; NORMAL is
  // safe under WAL (a power cut can lose the last commit, never corrupt the
  // file) and skips most fsyncs; foreign keys are off in SQLite unless asked;
  // and a writer waits up to 5 s for a lock instead of failing "database is
  // locked" at once. WAL needs one host: never put app.db on a network share.
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("synchronous = NORMAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");
  const db = drizzle(sqlite, { schema });
  return { db, sqlite };
}
