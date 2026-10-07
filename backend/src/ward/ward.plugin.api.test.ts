import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type BetterSqlite3 from "better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { buildApp } from "../app.js";
import { createDb } from "../db/index.js";
import { event, place } from "../db/schema.js";
import { createWardClient, type WardClient } from "./ward.client.js";
import { WardUnavailableError, type WardCaller } from "./ward.types.js";
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

/**
 * A Ward client that counts every call and answers however a case says. The
 * default never answers at all: a public route that waited on it would hang.
 */
function stubWard(answer: () => Promise<WardCaller> = () => new Promise(() => {})) {
  let calls = 0;
  const call = <T>(run: () => Promise<T>) => {
    calls++;
    return run();
  };
  const client: WardClient = {
    verify: () => call(() => new Promise(() => {})),
    introspect: () => call(() => new Promise(() => {})),
    readAccessCookie: () => {
      calls++;
      return undefined;
    },
    authenticate: () => call(answer),
    sendNotification: () => call(() => new Promise(() => {})),
  };
  return { client, calls: () => calls };
}

const caller = (grants: Record<string, string[]>): WardCaller => ({
  active: true,
  subject: "subject-1",
  username: "ana",
  grants,
  sid: "device-1",
});

// Brief 30: the root preHandler asked Ward on every request carrying the
// estate-wide cookie, so a slow Ward slowed the public map for anyone signed in
// anywhere in the estate. Only the guards and /api/me ask now.
describe("Ward plugin: asked only where a user is needed", () => {
  let app: FastifyInstance;
  let sqlite: BetterSqlite3.Database;
  const PLACE = randomUUID();
  const EVENT = randomUUID();
  const cookie = "ward_session=some-token";

  async function boot(client: WardClient, extra?: (app: FastifyInstance) => void) {
    const created = createDb(":memory:");
    sqlite = created.sqlite;
    migrate(created.db, { migrationsFolder });
    await created.db.insert(place).values({
      id: PLACE, name: "Biblioteca", category: "library", source: "osm",
      city: "Timișoara", lat: 45.75, lng: 21.22,
    });
    await created.db.insert(event).values({
      id: EVENT, placeId: PLACE, title: "Lectură", category: "community", status: "live",
      startDate: new Date(Date.now() + 86_400_000).toISOString(),
    });
    app = await buildApp({ db: created.db, logger: false, ward: client });
    extra?.(app);
    await app.ready();
  }

  afterEach(async () => {
    await app.close();
    sqlite.close();
  });

  it("public reads answer with a session cookie while Ward never answers, and Ward is not asked", async () => {
    const ward = stubWard();
    await boot(ward.client);
    for (const url of [
      "/api/places?city=Timișoara",
      `/api/places/${PLACE}`,
      `/api/places/${PLACE}/events`,
      "/api/whats-on?city=Timișoara",
      "/api/events?lat=45.75&lng=21.22",
      `/api/events/${EVENT}`,
      "/api/archive?city=Timișoara",
      "/health",
    ]) {
      const res = await app.inject({ method: "GET", url, headers: { cookie } });
      expect(res.statusCode, url).toBe(200);
    }
    expect(ward.calls()).toBe(0);
  });

  it("a guarded route is 503 when Ward is unavailable", async () => {
    const ward = stubWard(() => Promise.reject(new WardUnavailableError("down")));
    await boot(ward.client);
    const res = await app.inject({ method: "GET", url: "/api/favorites", headers: { cookie } });
    expect(res.statusCode).toBe(503);
    expect(res.json().code).toBe("IDENTITY_UNAVAILABLE");
    const me = await app.inject({ method: "GET", url: "/api/me", headers: { cookie } });
    expect(me.statusCode).toBe(503);
  });

  it("a guarded route is 401 without a cookie, and Ward is not asked", async () => {
    const ward = stubWard();
    await boot(ward.client);
    const res = await app.inject({ method: "GET", url: "/api/favorites" });
    expect(res.statusCode).toBe(401);
    const me = await app.inject({ method: "GET", url: "/api/me" });
    expect(me.json()).toEqual({ user: null });
    expect(ward.calls()).toBe(0);
  });

  it("a guarded route is 403 without the grant", async () => {
    const ward = stubWard(async () => caller({ atrium: ["user"] }));
    await boot(ward.client);
    const res = await app.inject({ method: "GET", url: "/api/favorites", headers: { cookie } });
    expect(res.statusCode).toBe(403);
    const admin = await app.inject({ method: "GET", url: "/api/admin/sources", headers: { cookie } });
    expect(admin.statusCode).toBe(403);
  });

  it("/api/me resolves the session itself", async () => {
    const ward = stubWard(async () => caller({ prm: ["admin"] }));
    await boot(ward.client);
    const res = await app.inject({ method: "GET", url: "/api/me", headers: { cookie } });
    expect(res.json()).toEqual({ user: { subject: "subject-1", username: "ana", isAdmin: true } });
    expect(ward.calls()).toBe(1);
  });

  it("asks Ward once per request, through two guards and the handler", async () => {
    const ward = stubWard(async () => caller({ prm: ["user", "admin"] }));
    await boot(ward.client, (app) => {
      app.get(
        "/test/both",
        { preHandler: [app.requireAuth, app.requireAdmin] },
        async (req) => {
          await app.resolveWard(req);
          return { subject: req.ward?.subject };
        },
      );
    });
    const res = await app.inject({ method: "GET", url: "/test/both", headers: { cookie } });
    expect(res.json()).toEqual({ subject: "subject-1" });
    expect(ward.calls()).toBe(1);
  });
});
