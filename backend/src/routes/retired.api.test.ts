import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildTestApp, type TestApp } from "../test/harness.js";
import { event, eventSource, favoritePlace, notification, place, stagedEvent } from "../db/schema.js";

const DAY = 86_400_000;
const at = (ms: number) => new Date(Date.now() + ms).toISOString();

// Brief 34: a place OSM no longer has keeps its row, but no public read returns
// it or its events; the people who followed it see it named, not linked.
describe("a retired place", () => {
  let t: TestApp;
  let cookie: string;
  let admin: string;

  beforeAll(async () => {
    t = await buildTestApp();
    await t.db.insert(place).values([
      { id: "open", name: "Biblioteca deschisă", category: "library", source: "osm", osmType: "node", osmId: "1", city: "Timișoara", lat: 45.75, lng: 21.22 },
      {
        id: "gone", name: "Biblioteca închisă", category: "library", source: "osm", osmType: "node", osmId: "2",
        city: "Timișoara", lat: 45.751, lng: 21.221, retiredAt: at(-DAY),
      },
    ]);
    await t.db.insert(event).values([
      { id: "open-soon", placeId: "open", title: "Lectură", category: "community", startDate: at(DAY) },
      { id: "gone-soon", placeId: "gone", title: "Atelier", category: "workshop", startDate: at(DAY) },
      { id: "open-past", placeId: "open", title: "Lectură veche", category: "community", startDate: at(-2 * DAY) },
      { id: "gone-past", placeId: "gone", title: "Atelier vechi", category: "workshop", startDate: at(-2 * DAY) },
    ]);
    await t.db.insert(favoritePlace).values({ subject: "ana", placeId: "gone" });
    await t.db.insert(notification).values({ subject: "ana", kind: "new-event", placeId: "gone" });
    await t.db.insert(eventSource).values({ id: "src", name: "Feed", adapterKey: "ical:feed", mechanism: "ical", city: "Timișoara" });
    await t.db.insert(stagedEvent).values({
      id: "pending", sourceId: "src", matchStatus: "unmatched", status: "new", title: "Concert", startDate: at(DAY),
    });
    t.ward.signIn("ana-token", "ana", { prm: ["user"] });
    t.ward.signIn("admin-token", "admin", { prm: ["admin"] });
    cookie = "ward_session=ana-token";
    admin = "ward_session=admin-token";
  });

  afterAll(async () => {
    await t.close();
  });

  const get = (url: string, headers: Record<string, string> = {}) => t.app.inject({ method: "GET", url, headers });
  const ids = (body: { data: { id?: string; event?: { id: string } }[] }) =>
    body.data.map((r) => r.event?.id ?? r.id);

  it("is not on the map, and its page and programme are not found", async () => {
    const list = await get("/api/places?city=Timișoara&pageSize=100");
    expect(ids(list.json())).toEqual(["open"]);
    expect(list.json().total).toBe(1);
    expect((await get("/api/places/gone")).statusCode).toBe(404);
    expect((await get("/api/places/gone/events")).statusCode).toBe(404);
  });

  it("takes its events off what's on, the event list and the public archive", async () => {
    expect(ids((await get("/api/whats-on?city=Timișoara")).json())).toEqual(["open-soon"]);
    expect(ids((await get("/api/events?lat=45.75&lng=21.22")).json()).sort()).toEqual(["open-past", "open-soon"]);
    expect((await get("/api/events/gone-soon")).statusCode).toBe(404);
    expect(ids((await get("/api/archive?city=Timișoara")).json())).toEqual(["open-past"]);
  });

  it("stays in a follower's past events and bell, named but marked no longer listed", async () => {
    const mine = (await get("/api/archive/mine", { cookie })).json();
    expect(mine.data).toHaveLength(1);
    expect(mine.data[0].place).toMatchObject({ id: "gone", name: "Biblioteca închisă", listed: false });

    const inbox = (await get("/api/notifications", { cookie })).json();
    expect(inbox.data[0].place).toEqual({ id: "gone", name: "Biblioteca închisă", listed: false });
  });

  it("cannot be followed, or picked as a staged event's place", async () => {
    const follow = await t.app.inject({ method: "POST", url: "/api/favorites/places/gone", headers: { cookie } });
    expect(follow.statusCode).toBe(404);
    const pick = await t.app.inject({
      method: "POST",
      url: "/api/admin/staged-events/pending/place",
      headers: { cookie: admin },
      payload: { placeId: "gone" },
    });
    expect(pick.statusCode).toBe(400);
    const ok = await t.app.inject({
      method: "POST",
      url: "/api/admin/staged-events/pending/place",
      headers: { cookie: admin },
      payload: { placeId: "open" },
    });
    expect(ok.statusCode).toBe(200);
  });
});
