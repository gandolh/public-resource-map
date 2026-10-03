import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { buildTestApp, type TestApp } from "../test/harness.js";
import { event, favoriteEvent, favoritePlace, place } from "../db/schema.js";

/** Brief 14: what happened, newest first; yours and the city's. */

let t: TestApp;
const hour = 60 * 60 * 1000;
const ago = (hours: number) => new Date(Date.now() - hours * hour).toISOString();

let tm: string;
let bu: string;
const ids: Record<string, string> = {};

beforeEach(async () => {
  t = await buildTestApp();
  const add = (name: string, city: string) =>
    t.db.insert(place).values({ name, category: "museum", city, lat: 45.75, lng: 21.22 }).returning({ id: place.id }).get().id;
  tm = add("Muzeul de Artă", "Timișoara");
  bu = add("MNAR", "București");
  const ev = (title: string, placeId: string, startDate: string, extra: Partial<typeof event.$inferInsert> = {}) => {
    ids[title] = t.db.insert(event).values({ placeId, title, category: "concert", startDate, ...extra }).returning({ id: event.id }).get().id;
  };
  ev("last week", tm, ago(24 * 7));
  ev("yesterday", tm, ago(24), { category: "exhibition" });
  ev("running", tm, ago(48), { endDate: new Date(Date.now() + 24 * hour).toISOString() });
  ev("tomorrow", tm, new Date(Date.now() + 24 * hour).toISOString());
  ev("cancelled", tm, ago(30), { status: "ended" });
  ev("in bucharest", bu, ago(5));
});
afterEach(async () => {
  await t.close();
});

const titles = (body: { data: { event: { title: string } }[] }) => body.data.map((d) => d.event.title);

describe("GET /api/archive", () => {
  it("lists a city's past events newest first; not upcoming, running or cancelled ones", async () => {
    const res = await t.app.inject({ method: "GET", url: "/api/archive?city=Timișoara" });
    expect(res.statusCode).toBe(200);
    expect(titles(res.json())).toEqual(["yesterday", "last week"]);
    expect(res.json().total).toBe(2);
    expect(res.json().data[0].place).toMatchObject({ id: tm, name: "Muzeul de Artă" });
  });

  it("filters by event category and pages", async () => {
    expect(titles((await t.app.inject({ method: "GET", url: "/api/archive?city=Timișoara&category=exhibition" })).json())).toEqual(["yesterday"]);
    const second = (await t.app.inject({ method: "GET", url: "/api/archive?city=Timișoara&pageSize=1&page=2" })).json();
    expect(titles(second)).toEqual(["last week"]);
    expect(second.total).toBe(2);
  });
});

describe("GET /api/archive/mine", () => {
  it("needs a signed-in person", async () => {
    expect((await t.app.inject({ method: "GET", url: "/api/archive/mine" })).statusCode).toBe(401);
  });

  it("is what you saved plus what happened at places you follow, across cities", async () => {
    const token = randomUUID();
    t.ward.signIn(token, "me", { prm: ["user"] });
    t.db.insert(favoriteEvent).values({ subject: "me", eventId: ids["in bucharest"] }).run();
    t.db.insert(favoritePlace).values({ subject: "me", placeId: tm }).run();
    // Someone else's favourites are not mine.
    t.db.insert(favoriteEvent).values({ subject: "other", eventId: ids["last week"] }).run();

    const res = await t.app.inject({ method: "GET", url: "/api/archive/mine", headers: { cookie: `ward_session=${token}` } });
    expect(titles(res.json())).toEqual(["in bucharest", "yesterday", "last week"]);

    t.db.delete(favoritePlace).run();
    const only = await t.app.inject({ method: "GET", url: "/api/archive/mine", headers: { cookie: `ward_session=${token}` } });
    expect(titles(only.json())).toEqual(["in bucharest"]);
  });
});
