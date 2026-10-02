import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type BetterSqlite3 from "better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { fileURLToPath } from "node:url";
import { buildApp } from "../app.js";
import { createDb } from "../db/index.js";
import { createWardClient } from "./ward.client.js";
import { BASE, ORIGIN, makeKeys, signToken, wardFetch } from "../test/real-ward.js";

const migrationsFolder = fileURLToPath(new URL("../../drizzle", import.meta.url));

// Brief 21, end to end through the real client: with Ward's key set
// unreachable, a signed-in person is "identity unavailable" (503), never
// "signed out", and the public map keeps working.
describe("Ward plugin: key set unreachable", () => {
  let app: FastifyInstance;
  let sqlite: BetterSqlite3.Database;
  let cookie: string;

  beforeAll(async () => {
    const created = createDb(":memory:");
    sqlite = created.sqlite;
    migrate(created.db, { migrationsFolder });

    const ward = createWardClient({
      publicOrigin: ORIGIN,
      apiBasePath: BASE,
      appKey: "k",
      fetch: wardFetch({ jwks: () => { throw new TypeError("fetch failed"); } }),
    });
    app = await buildApp({ db: created.db, logger: false, ward });
    await app.ready();

    cookie = `ward_session=${await signToken(await makeKeys("ward-key-1"))}`;
  });

  afterAll(async () => {
    await app.close();
    sqlite.close();
  });

  it("GET /api/me is 503, not a signed-out answer", async () => {
    const res = await app.inject({ method: "GET", url: "/api/me", headers: { cookie } });
    expect(res.statusCode).toBe(503);
    expect(res.json().code).toBe("IDENTITY_UNAVAILABLE");
  });

  it("the public map is unaffected", async () => {
    const res = await app.inject({ method: "GET", url: "/api/places", headers: { cookie } });
    expect(res.statusCode).toBe(200);
  });

  it("an admin route is 503, not 401", async () => {
    const res = await app.inject({ method: "POST", url: "/api/admin/osm/sync", headers: { cookie } });
    expect(res.statusCode).toBe(503);
  });
});
