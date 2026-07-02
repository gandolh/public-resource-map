import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { buildTestApp, type TestApp } from "../test/harness.js";
import { place } from "../db/schema.js";

// API integration: real Fastify app + `.inject()` against fresh in-memory SQLite.
describe("places API (GET /api/places [+ /:id])", () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await buildTestApp();
    await t.db.insert(place).values([
      {
        id: randomUUID(),
        name: "Central Library",
        category: "library",
        source: "osm",
        city: "Timișoara",
        lat: 45.7489,
        lng: 21.2087,
      },
      {
        id: randomUUID(),
        name: "National Theatre",
        category: "theater",
        source: "osm",
        city: "București",
        lat: 44.4268,
        lng: 26.1025,
      },
    ]);
  });

  afterAll(async () => {
    await t.close();
  });

  it("filters by city and returns the Place shape", async () => {
    const res = await t.app.inject({
      method: "GET",
      url: "/api/places?city=Timișoara",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total).toBe(1);
    expect(body.data[0].name).toBe("Central Library");
    expect(body.data[0].coordinates).toEqual({ lat: 45.7489, lng: 21.2087 });
    expect(body.data[0].source).toBe("osm");
  });

  it("still supports the nearby (lat/lng/radius) lens for the map", async () => {
    const near = await t.app.inject({
      method: "GET",
      url: "/api/places?lat=45.7489&lng=21.2087&radiusKm=5",
    });
    expect(near.statusCode).toBe(200);
    expect(near.json().total).toBe(1);

    const far = await t.app.inject({
      method: "GET",
      url: "/api/places?lat=44.4268&lng=26.1025&radiusKm=5",
    });
    expect(far.json().total).toBe(1);
    expect(far.json().data[0].name).toBe("National Theatre");
  });

  it("400s on an invalid query", async () => {
    const res = await t.app.inject({
      method: "GET",
      url: "/api/places?lat=999&lng=0",
    });
    expect(res.statusCode).toBe(400);
  });

  it("GET /api/places/:id round-trips a single place and 404s unknown", async () => {
    const list = await t.app.inject({
      method: "GET",
      url: "/api/places?city=București",
    });
    const id = list.json().data[0].id;

    const get = await t.app.inject({ method: "GET", url: `/api/places/${id}` });
    expect(get.statusCode).toBe(200);
    expect(get.json().name).toBe("National Theatre");

    const missing = await t.app.inject({
      method: "GET",
      url: `/api/places/${randomUUID()}`,
    });
    expect(missing.statusCode).toBe(404);
  });
});
