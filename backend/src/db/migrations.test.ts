import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const meta = fileURLToPath(new URL("../../drizzle/meta/", import.meta.url));

interface Journal {
  entries: { idx: number; tag: string }[];
}
interface Snapshot {
  id: string;
  prevId: string;
}

const pad = (idx: number) => String(idx).padStart(4, "0");

// Brief 23: 0001_ward_cutover was hand-written without a snapshot, so
// drizzle-kit diffed schema.ts against the pre-cutover 0000 snapshot and offered
// to re-drop tables that no longer exist. A hand-written migration must ship
// its snapshot too, chained to the one before it.
describe("drizzle migration metadata", () => {
  const journal = JSON.parse(readFileSync(`${meta}_journal.json`, "utf8")) as Journal;

  it("every journal entry has a snapshot", () => {
    const missing = journal.entries
      .map((e) => `${pad(e.idx)}_snapshot.json`)
      .filter((file) => !existsSync(`${meta}${file}`));
    expect(missing).toEqual([]);
  });

  it("each snapshot's prevId is the previous snapshot's id", () => {
    let prev = "00000000-0000-0000-0000-000000000000";
    for (const { idx } of journal.entries) {
      const snap = JSON.parse(readFileSync(`${meta}${pad(idx)}_snapshot.json`, "utf8")) as Snapshot;
      expect(snap.prevId, `${pad(idx)}_snapshot.json`).toBe(prev);
      prev = snap.id;
    }
  });
});

// Brief 29: the migrated database must be the one `schema.ts` describes. The
// hand-written 0001 rebuilt tables that did not match it, and nothing noticed:
// drizzle-kit diffs snapshots, not databases. This compares the real thing,
// a database migrated from empty against one built from `schema.ts` alone.
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { generateSQLiteDrizzleJson, generateSQLiteMigration } from "drizzle-kit/api";
import * as schema from "./schema.js";

const migrationsFolder = fileURLToPath(new URL("../../drizzle/", import.meta.url));

/**
 * `CURRENT_TIMESTAMP` and `datetime('now')` write the same UTC text
 * ("YYYY-MM-DD HH:MM:SS"); 0001 spelled one, `schema.ts` the other. Treated as
 * one default rather than rebuilding three tables over a spelling.
 */
const normalizeDefault = (value: string | null) =>
  value === null ? null : value.replace(/^\((.*)\)$/, "$1").replace(/^datetime\('now'\)$/i, "CURRENT_TIMESTAMP");

function shape(db: Database.Database) {
  const tables = (
    db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '__drizzle%' ORDER BY name")
      .all() as { name: string }[]
  ).map((t) => t.name);
  return Object.fromEntries(
    tables.map((table) => {
      const columns = (db.prepare(`PRAGMA table_info(\`${table}\`)`).all() as Record<string, unknown>[]).map((c) => ({
        name: c.name,
        type: c.type,
        notnull: c.notnull,
        dflt: normalizeDefault(c.dflt_value as string | null),
        pk: c.pk,
      }));
      const indexes = (db.prepare(`PRAGMA index_list(\`${table}\`)`).all() as Record<string, unknown>[])
        .map((i) => ({
          name: String(i.name).startsWith("sqlite_autoindex") ? `(auto:${i.origin})` : i.name,
          unique: i.unique,
          partial: i.partial,
          columns: (db.prepare(`PRAGMA index_info(\`${i.name}\`)`).all() as { name: string }[]).map((c) => c.name),
        }))
        .sort((a, b) => String(a.name).localeCompare(String(b.name)));
      const foreignKeys = (db.prepare(`PRAGMA foreign_key_list(\`${table}\`)`).all() as Record<string, unknown>[])
        .map((f) => ({ table: f.table, from: f.from, to: f.to, onDelete: f.on_delete, onUpdate: f.on_update }))
        .sort((a, b) => String(a.from).localeCompare(String(b.from)));
      return [table, { columns, indexes, foreignKeys }];
    }),
  );
}

describe("the migrated schema is schema.ts (brief 29)", () => {
  it("matches table for table: columns, indexes and foreign keys", async () => {
    const migrated = new Database(":memory:");
    migrate(drizzle(migrated), { migrationsFolder });

    const fresh = new Database(":memory:");
    const statements = await generateSQLiteMigration(
      await generateSQLiteDrizzleJson({}),
      await generateSQLiteDrizzleJson(schema),
    );
    for (const statement of statements) fresh.exec(statement);

    expect(shape(migrated)).toEqual(shape(fresh));
  });
});
