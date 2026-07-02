import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { buildTestApp, type TestApp } from "../test/harness.js";
import { event, place } from "../db/schema.js";

// Demonstrates the event↔place join path against the temp-DB harness — the
// pattern brief 04 (ingestion) builds its API integration tests on.
describe("events API (Fastify .inject() + temp SQLite)", () => {
  let t: TestApp;
  const placeId = randomUUID();

  beforeAll(async () => {
    t = await buildTestApp();
    await t.db.insert(place).values({
      id: placeId,
      name: "Concert Hall",
      category: "theater",
      source: "osm",
      city: "Timișoara",
      lat: 45.7489,
      lng: 21.2087,
    });
    await t.db.insert(event).values({
      id: randomUUID(),
      placeId,
      title: "Opening Night",
      category: "concert",
      status: "live",
      startDate: "2026-08-01T18:00:00.000Z",
    });
  });

  afterAll(async () => {
    await t.close();
  });

  it("GET /api/events returns events joined to a place within radius", async () => {
    const res = await t.app.inject({
      method: "GET",
      url: "/api/events?lat=45.7489&lng=21.2087&radiusKm=5",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total).toBe(1);
    expect(body.data[0].title).toBe("Opening Night");
    expect(body.data[0].placeId).toBe(placeId);
  });
});
