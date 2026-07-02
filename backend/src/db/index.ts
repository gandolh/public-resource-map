import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import * as schema from "./schema.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultDbPath = path.resolve(__dirname, "../../data/app.db");

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
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });
  return { db, sqlite };
}
