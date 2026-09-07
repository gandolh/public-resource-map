import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { buildTestApp, type TestApp } from "../test/harness.js";
import { event, place } from "../db/schema.js";

const MUSEUM = randomUUID();
const PARK = randomUUID();
const QUIET = randomUUID();

function inDays(days: number, hour = 12): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
}

// The map, the place panel and the what's-on index are three lenses on one set
// of rows. These tests exist to keep them agreeing.
describe("place programme + citywide what's-on", () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await buildTestApp();
    await t.db.insert(place).values([
      { id: MUSEUM, name: "Muzeul de Artă", category: "museum", source: "osm",
        city: "Timișoara", lat: 45.7571, lng: 21.2287 },
      { id: PARK, name: "Parcul Central", category: "park", source: "osm",
        city: "Timișoara", lat: 45.7489, lng: 21.2261 },
      { id: QUIET, name: "Biblioteca Județeană", category: "library", source: "osm",
        city: "Timișoara", lat: 45.7601, lng: 21.2201 },
    ]);
    await t.db.insert(event).values([
      { id: randomUUID(), placeId: MUSEUM, title: "Expoziție Baba",
        category: "exhibition", status: "live", startDate: inDays(3) },
      { id: randomUUID(), placeId: MUSEUM, title: "Tur ghidat",
        category: "workshop", status: "live", startDate: inDays(5) },
      { id: randomUUID(), placeId: PARK, title: "Concert în parc",
        category: "concert", status: "live", startDate: inDays(10) },
      // Excluded on every surface: retracted, already over, and beyond horizon.
      { id: randomUUID(), placeId: MUSEUM, title: "Retras la sursă",
        category: "other", status: "stale", startDate: inDays(4) },
      { id: randomUUID(), placeId: MUSEUM, title: "Anul trecut",
        category: "other", status: "past", startDate: inDays(-30) },
      { id: randomUUID(), placeId: PARK, title: "Peste orizont",
        category: "other", status: "live", startDate: inDays(200) },
    ]);
  });

  afterAll(async () => {
    await t.close();
  });

  it("gives every pin its upcoming-event count in one request", async () => {
    const res = await t.app.inject({ method: "GET", url: "/api/places?city=Timișoara&pageSize=100" });
    expect(res.statusCode).toBe(200);
    const byName = Object.fromEntries(
      res.json().data.map((p: { name: string; upcomingEventCount: number }) => [
        p.name,
        p.upcomingEventCount,
      ]),
    );
    expect(byName["Muzeul de Artă"]).toBe(2); // stale, past and out-of-horizon excluded
    expect(byName["Parcul Central"]).toBe(1);
    expect(byName["Biblioteca Județeană"]).toBe(0);
  });

  it("accepts several category chips at once", async () => {
    const res = await t.app.inject({
      method: "GET",
      url: "/api/places?city=Timișoara&category=museum,park",
    });
    expect(res.json().total).toBe(2);
  });

  it("the timing lens removes places instead of dimming them", async () => {
    const res = await t.app.inject({ method: "GET", url: "/api/places?city=Timișoara&lens=today" });
    // Nothing is scheduled for today in the fixture, so the map goes empty
    // rather than returning greyed-out pins.
    expect(res.json().total).toBe(0);
  });

  it("serves a place's programme, upcoming and live only, in date order", async () => {
    const res = await t.app.inject({ method: "GET", url: `/api/places/${MUSEUM}/events` });
    expect(res.statusCode).toBe(200);
    const titles = res.json().data.map((e: { title: string }) => e.title);
    expect(titles).toEqual(["Expoziție Baba", "Tur ghidat"]);
  });

  it("404s the programme of a place that does not exist", async () => {
    const res = await t.app.inject({ method: "GET", url: "/api/places/nope/events" });
    expect(res.statusCode).toBe(404);
  });

  it("lists the city's events date-first, each carrying its place", async () => {
    const res = await t.app.inject({ method: "GET", url: "/api/whats-on?city=Timișoara" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total).toBe(3);
    expect(body.data[0].event.title).toBe("Expoziție Baba");
    expect(body.data[0].place.name).toBe("Muzeul de Artă");
    expect(body.data[0].place.coordinates).toEqual({ lat: 45.7571, lng: 21.2287 });
  });

  it("what's-on honours the map's category chips, so the two cannot disagree", async () => {
    const res = await t.app.inject({ method: "GET", url: "/api/whats-on?city=Timișoara&category=park" });
    expect(res.json().data.map((i: { event: { title: string } }) => i.event.title))
      .toEqual(["Concert în parc"]);
  });
});
