import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { createDb } from "./index.js";

const migrationsFolder = fileURLToPath(new URL("../../drizzle", import.meta.url));

/**
 * Brief 12: what the connection promises. A file, not ":memory:", because an
 * in-memory database cannot be in WAL mode.
 */
describe("the database connection", () => {
  let dir: string | null = null;
  const open = () => {
    dir = mkdtempSync(join(tmpdir(), "prm-db-"));
    return createDb(join(dir, "app.db"));
  };

  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
    dir = null;
  });

  it("runs WAL with synchronous NORMAL, enforced foreign keys and a 5 s busy wait", () => {
    const { sqlite } = open();
    try {
      expect(sqlite.pragma("journal_mode", { simple: true })).toBe("wal");
      expect(sqlite.pragma("synchronous", { simple: true })).toBe(1); // NORMAL
      expect(sqlite.pragma("foreign_keys", { simple: true })).toBe(1);
      expect(sqlite.pragma("busy_timeout", { simple: true })).toBe(5000);
    } finally {
      sqlite.close();
    }
  });

  it("answers the map's city filter and the proximity box from an index", () => {
    const { db, sqlite } = open();
    try {
      migrate(db, { migrationsFolder });
      const plan = (query: string) =>
        (sqlite.prepare(`EXPLAIN QUERY PLAN ${query}`).all() as { detail: string }[])
          .map((row) => row.detail)
          .join("\n");

      expect(plan("SELECT id FROM place WHERE city = 'Timișoara'")).toMatch(
        /USING INDEX place_city_idx/,
      );
      expect(
        plan(
          "SELECT id FROM place WHERE lat BETWEEN 45.7 AND 45.8 AND lng BETWEEN 21.1 AND 21.3",
        ),
      ).toMatch(/USING INDEX place_lat_lng_idx/);
    } finally {
      sqlite.close();
    }
  });
});
