import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { buildTestApp, type TestApp } from "../test/harness.js";
import { eventSource, place, stagedEvent } from "../db/schema.js";

/** Brief 05: favourites, the new-events trigger at accept, and the inbox. */

let t: TestApp;
let museum: string;
let park: string;

beforeEach(async () => {
  t = await buildTestApp();
  const add = (name: string) =>
    t.db.insert(place).values({ name, category: "museum", city: "Timișoara", lat: 45.75, lng: 21.22 }).returning({ id: place.id }).get().id;
  museum = add("Muzeul de Artă");
  park = add("Parcul Rozelor");
});
afterEach(async () => {
  await t.close();
});

function signIn(role: "user" | "admin" = "user", subject = `subject_${randomUUID()}`) {
  const token = randomUUID();
  t.ward.signIn(token, subject, { prm: [role] });
  return { cookie: `ward_session=${token}`, subject };
}

async function call(cookie: string | null, method: "GET" | "POST" | "DELETE", url: string, payload?: unknown) {
  const res = await t.app.inject({ method, url, payload: payload as object, headers: cookie ? { cookie } : {} });
  return { status: res.statusCode, body: res.body ? (JSON.parse(res.body) as any) : null };
}

/** Stage `n` events at a place and accept them in one call, as an admin would. */
async function publish(placeId: string, titles: string[]) {
  const source = t.db
    .insert(eventSource)
    .values({ name: "Test", adapterKey: `test:${randomUUID()}`, mechanism: "ical", city: "Timișoara" })
    .returning({ id: eventSource.id })
    .get().id;
  const ids = titles.map(
    (title) =>
      t.db
        .insert(stagedEvent)
        .values({ sourceId: source, placeId, matchStatus: "auto-matched", status: "new", title, startDate: "2026-11-01T17:00:00.000Z", category: "concert" })
        .returning({ id: stagedEvent.id })
        .get().id,
  );
  const admin = signIn("admin");
  return (await call(admin.cookie, "POST", "/api/admin/staged-events/accept", { ids })).body;
}

describe("favourites", () => {
  it("need a signed-in person", async () => {
    expect((await call(null, "GET", "/api/favorites")).status).toBe(401);
    expect((await call(null, "POST", `/api/favorites/places/${museum}`)).status).toBe(401);
    expect((await call(null, "GET", "/api/notifications")).status).toBe(401);
  });

  it("are added and removed idempotently, per person", async () => {
    const a = signIn();
    const b = signIn();
    expect((await call(a.cookie, "POST", `/api/favorites/places/${museum}`)).status).toBe(204);
    expect((await call(a.cookie, "POST", `/api/favorites/places/${museum}`)).status).toBe(204);
    expect((await call(a.cookie, "GET", "/api/favorites")).body).toEqual({ places: [museum], events: [] });
    expect((await call(b.cookie, "GET", "/api/favorites")).body).toEqual({ places: [], events: [] });
    expect((await call(a.cookie, "DELETE", `/api/favorites/places/${museum}`)).status).toBe(204);
    expect((await call(a.cookie, "DELETE", `/api/favorites/places/${museum}`)).status).toBe(204);
    expect((await call(a.cookie, "GET", "/api/favorites")).body.places).toEqual([]);
  });

  it("404 on a place or event that does not exist", async () => {
    const a = signIn();
    expect((await call(a.cookie, "POST", "/api/favorites/places/nope")).status).toBe(404);
    expect((await call(a.cookie, "POST", "/api/favorites/events/nope")).status).toBe(404);
  });
});

describe("the new-events trigger at accept", () => {
  it("gives each follower of the place one item per batch, listing its events", async () => {
    const fan = signIn();
    const other = signIn();
    await call(fan.cookie, "POST", `/api/favorites/places/${museum}`);
    await call(other.cookie, "POST", `/api/favorites/places/${park}`);

    const result = await publish(museum, ["Tur ghidat", "Vernisaj", "Concert"]);
    expect(result.accepted).toHaveLength(3);
    expect(result.notified).toBe(1);

    const inbox = (await call(fan.cookie, "GET", "/api/notifications")).body;
    expect(inbox.unread).toBe(1);
    expect(inbox.data).toHaveLength(1);
    expect(inbox.data[0]).toMatchObject({ kind: "new-event", readAt: null, place: { id: museum, name: "Muzeul de Artă" } });
    expect(inbox.data[0].events.map((e: { title: string }) => e.title).sort()).toEqual(["Concert", "Tur ghidat", "Vernisaj"]);

    // Someone who follows another place hears nothing.
    expect((await call(other.cookie, "GET", "/api/notifications")).body).toEqual({ unread: 0, data: [] });
  });

  it("a second accept is a second item; marking read works by id or all at once", async () => {
    const fan = signIn();
    await call(fan.cookie, "POST", `/api/favorites/places/${museum}`);
    await publish(museum, ["Unu"]);
    await publish(museum, ["Doi"]);
    let inbox = (await call(fan.cookie, "GET", "/api/notifications")).body;
    expect(inbox.unread).toBe(2);

    expect((await call(fan.cookie, "POST", "/api/notifications/read", { ids: [inbox.data[0].id] })).body).toEqual({ read: 1 });
    inbox = (await call(fan.cookie, "GET", "/api/notifications")).body;
    expect(inbox.unread).toBe(1);
    expect((await call(fan.cookie, "POST", "/api/notifications/read", { all: true })).body).toEqual({ read: 1 });
    expect((await call(fan.cookie, "GET", "/api/notifications")).body.unread).toBe(0);
  });

  it("nobody can read or mark someone else's items", async () => {
    const fan = signIn();
    const stranger = signIn();
    await call(fan.cookie, "POST", `/api/favorites/places/${museum}`);
    await publish(museum, ["Unu"]);
    const [item] = (await call(fan.cookie, "GET", "/api/notifications")).body.data;
    expect((await call(stranger.cookie, "POST", "/api/notifications/read", { ids: [item.id] })).body).toEqual({ read: 0 });
    expect((await call(fan.cookie, "GET", "/api/notifications")).body.unread).toBe(1);
  });
});
