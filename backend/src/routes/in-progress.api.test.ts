import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { buildTestApp, type TestApp } from "../test/harness.js";
import { event, place } from "../db/schema.js";

const RUNNING = randomUUID();
const ENDED = randomUUID();
const POINT = randomUUID();
const FAR = randomUUID();

const DAY = 86_400_000;
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();
const ahead = (ms: number) => new Date(Date.now() + ms).toISOString();

// Brief 19: every surface asked "does it start inside the window?", so an event
// vanished the minute it began. Now they ask "does its span overlap the window?".
describe("in-progress events", () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await buildTestApp();
    // One event per place, so each place's count speaks for exactly one event.
    await t.db.insert(place).values(
      [
        [RUNNING, "Muzeul cu expoziție"],
        [ENDED, "Sala care a închis"],
        [POINT, "Clubul de aseară"],
        [FAR, "Teatrul de la iarnă"],
      ].map(([id, name], i) => ({
        id: id!, name: name!, category: "museum", source: "osm",
        city: "Cluj-Napoca", lat: 46.77 + i / 100, lng: 23.59,
      })),
    );
    await t.db.insert(event).values([
      { id: randomUUID(), placeId: RUNNING, title: "Expoziție temporară",
        category: "exhibition", status: "live", startDate: ago(10 * DAY), endDate: ahead(20 * DAY) },
      { id: randomUUID(), placeId: ENDED, title: "S-a terminat ieri",
        category: "exhibition", status: "live", startDate: ago(5 * DAY), endDate: ago(DAY) },
      { id: randomUUID(), placeId: POINT, title: "A început acum un minut",
        category: "concert", status: "live", startDate: ago(60_000), endDate: null },
      { id: randomUUID(), placeId: FAR, title: "Peste o sută de zile",
        category: "concert", status: "live", startDate: ahead(100 * DAY), endDate: null },
    ]);
  });

  afterAll(async () => {
    await t.close();
  });

  async function counts(lens: string): Promise<Record<string, number>> {
    const res = await t.app.inject({
      method: "GET",
      url: `/api/places?city=Cluj-Napoca&lens=${lens}&pageSize=100`,
    });
    expect(res.statusCode).toBe(200);
    return Object.fromEntries(
      res.json().data.map((p: { id: string; upcomingEventCount: number }) => [
        p.id,
        p.upcomingEventCount,
      ]),
    );
  }

  it("counts a running exhibition on the pin under every lens", async () => {
    for (const lens of ["all", "today", "weekend"]) {
      expect((await counts(lens))[RUNNING], lens).toBe(1);
    }
  });

  it("keeps the running exhibition's place through the today hard-filter, and only it", async () => {
    expect(Object.keys(await counts("today"))).toEqual([RUNNING]);
  });

  it("lists the running exhibition in the place panel and in what's-on", async () => {
    const panel = await t.app.inject({ method: "GET", url: `/api/places/${RUNNING}/events` });
    expect(panel.json().data.map((e: { title: string }) => e.title)).toEqual(["Expoziție temporară"]);

    const list = await t.app.inject({ method: "GET", url: "/api/whats-on?city=Cluj-Napoca" });
    expect(
      list.json().data.map((i: { event: { title: string } }) => i.event.title),
    ).toEqual(["Expoziție temporară"]);
  });

  it("drops an event whose end has passed", async () => {
    expect((await counts("all"))[ENDED]).toBe(0);
    const panel = await t.app.inject({ method: "GET", url: `/api/places/${ENDED}/events` });
    expect(panel.json().data).toEqual([]);
  });

  it("drops a point event (null end) once it has started", async () => {
    expect((await counts("all"))[POINT]).toBe(0);
    const panel = await t.app.inject({ method: "GET", url: `/api/places/${POINT}/events` });
    expect(panel.json().data).toEqual([]);
  });

  it("keeps the 90-day horizon: an event 100 days out is not counted", async () => {
    expect((await counts("all"))[FAR]).toBe(0);
  });
});
