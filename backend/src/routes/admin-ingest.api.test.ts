import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { buildTestApp, type TestApp } from "../test/harness.js";
import { event, place, stagedEvent } from "../db/schema.js";
import type { AdapterRow, SourceAdapter } from "../ingest/adapters.js";
import type { GeocodeProvider } from "../ingest/geocode.js";

/**
 * Brief 04 — the ingestion pipeline end to end through its admin API, with an
 * injected adapter, geocoder and clock: nothing here reaches a real source or
 * Nominatim.
 */

const TM = "Timișoara";
let t: TestApp;
let feed: AdapterRow[];
let failNext: Error | null;
let clock: Date;
let geocodes: string[];

const fakeAdapter: SourceAdapter = {
  mechanism: "ical",
  productionAllowed: true,
  read: async () => {
    if (failNext) {
      const err = failNext;
      failNext = null;
      throw err;
    }
    return structuredClone(feed);
  },
};
const restrictedAdapter: SourceAdapter = { ...fakeAdapter, productionAllowed: false };

/** Club Daos geocodes inside Timișoara; anything else is a miss. */
const geocoder: GeocodeProvider = async (query) => {
  geocodes.push(query);
  return query.includes("Daos")
    ? { lat: 45.75, lng: 21.23, importance: 0.2, granularity: "building", raw: {} }
    : null;
};

const listing = (over: Partial<Record<string, unknown>> = {}): AdapterRow => ({
  raw: {
    externalId: "uid-casa",
    title: "Concert de toamnă",
    startDate: "2026-10-10T16:00:00.000Z",
    venue: "Sala Mare, Casa de Cultură",
    price: 20,
    currency: "RON",
    sourceUrl: "https://example.ro/e/1",
    ...over,
  },
});

async function build(production = false) {
  t = await buildTestApp({
    ingest: {
      adapters: { test: fakeAdapter, restricted: restrictedAdapter },
      geocoder,
      now: () => clock,
      production,
    },
  });
  for (const name of [
    "Casa de Cultură a Municipiului Timișoara",
    "Muzeul de Artă Timișoara",
    "Muzeul Național al Banatului",
  ]) {
    await t.db.insert(place).values({ name, category: "museum", city: TM, lat: 45.75, lng: 21.22 }).run();
  }
}

function as(role: "user" | "admin"): string {
  const token = randomUUID();
  t.ward.signIn(token, `subject_${token}`, { prm: [role] });
  return `ward_session=${token}`;
}

async function call(method: "GET" | "POST" | "PATCH", url: string, payload?: unknown) {
  const res = await t.app.inject({ method, url, payload: payload as object, headers: { cookie: as("admin") } });
  return { status: res.statusCode, body: res.json() as any };
}

async function addSource(adapterKey = "test:cpt", city = "timisoara") {
  const res = await call("POST", "/api/admin/sources", {
    name: `Source ${adapterKey}`,
    adapterKey,
    mechanism: "ical",
    url: "https://example.ro/feed.ics",
    city,
  });
  expect(res.status).toBe(201);
  return res.body.id as string;
}

const refresh = async (id: string) => (await call("POST", `/api/admin/sources/${id}/refresh`)).body;
const staged = async (status?: string) =>
  (await call("GET", `/api/admin/staged-events${status ? `?status=${status}` : ""}`)).body.data as any[];
const liveEvents = () => t.db.select().from(event).all();

beforeEach(async () => {
  feed = [];
  failNext = null;
  clock = new Date("2026-10-01T09:00:00.000Z");
  geocodes = [];
  await build();
});
afterEach(async () => {
  await t.close();
});

describe("the admin gate", () => {
  const routes: [string, string][] = [
    ["GET", "/api/admin/sources"],
    ["POST", "/api/admin/sources"],
    ["POST", "/api/admin/sources/x/refresh"],
    ["POST", "/api/admin/sources/refresh-all"],
    ["GET", "/api/admin/staged-events"],
    ["POST", "/api/admin/staged-events/accept"],
    ["POST", "/api/admin/staged-events/reject"],
    ["POST", "/api/admin/staged-events/x/place"],
  ];
  it.each(routes)("%s %s is 401 anonymous and 403 without the admin grant", async (method, url) => {
    const anon = await t.app.inject({ method: method as "GET", url });
    expect(anon.statusCode).toBe(401);
    const user = await t.app.inject({ method: method as "GET", url, headers: { cookie: as("user") } });
    expect(user.statusCode).toBe(403);
  });
});

describe("sources", () => {
  it("are created, listed, and refuse an unknown adapter or a taken key", async () => {
    await addSource();
    expect((await call("POST", "/api/admin/sources", { name: "x", adapterKey: "nope", mechanism: "ical", city: "timisoara" })).body.code).toBe("UNKNOWN_ADAPTER");
    expect((await call("POST", "/api/admin/sources", { name: "x", adapterKey: "test:cpt", mechanism: "ical", city: "timisoara" })).status).toBe(409);
    const list = (await call("GET", "/api/admin/sources")).body.data;
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ adapterKey: "test:cpt", city: TM, enabled: true, lastStatus: null });
  });
});

describe("a refresh stages a diff and publishes nothing", () => {
  it("sorts listings into matched, ambiguous, geocoded, quarantined and duplicate", async () => {
    const id = await addSource();
    feed = [
      listing(),
      listing(), // the same UID twice in one feed
      listing({ externalId: "uid-muzeu", title: "Tur ghidat", venue: "Muzeul Timișoara" }),
      listing({ externalId: "uid-daos", title: "Seară rock", venue: "Club Daos", address: "Str. Daos 1" }),
      { raw: { externalId: "uid-bad", venue: "x" } }, // no title, no date
      { raw: { externalId: "uid-rrule", title: "Weekly" }, problem: "a recurring event (RRULE)" },
    ];
    const summary = await refresh(id);
    expect(summary).toMatchObject({
      status: "ok",
      fetched: 4,
      new: 3,
      duplicates: 1,
      ambiguous: 1,
      unmatched: 1,
      needsAttention: 2,
    });
    expect(liveEvents()).toHaveLength(0);

    const rows = await staged();
    const byTitle = Object.fromEntries(rows.map((r) => [r.title, r]));
    expect(byTitle["Concert de toamnă"]).toMatchObject({ matchStatus: "auto-matched", status: "new" });
    expect(byTitle["Concert de toamnă"].placeId).toBeTruthy();
    expect(byTitle["Tur ghidat"].matchStatus).toBe("ambiguous");
    expect(byTitle["Tur ghidat"].candidates.length).toBeGreaterThan(0);
    expect(byTitle["Seară rock"]).toMatchObject({ matchStatus: "unmatched", lat: 45.75, lng: 21.23, placeId: null });
    expect(rows.filter((r) => r.status === "needs-attention").map((r) => r.issues)).toEqual(
      expect.arrayContaining([expect.stringMatching(/RRULE/), expect.stringMatching(/title/)]),
    );

    // Refreshing the same feed quarantines nothing twice and geocodes nothing twice.
    await refresh(id);
    expect(await staged("needs-attention")).toHaveLength(2);
    expect(geocodes.filter((q) => q.includes("Daos"))).toHaveLength(1);
  });
});

describe("accept, reject, resolve", () => {
  it("accepts what has a place, explains what has not, and creates a venue place once", async () => {
    const id = await addSource();
    feed = [
      listing(),
      listing({ externalId: "uid-muzeu", title: "Tur ghidat", venue: "Muzeul Timișoara" }),
      listing({ externalId: "uid-daos", title: "Seară rock", venue: "Club Daos", address: "Str. Daos 1" }),
      listing({ externalId: "uid-daos-2", title: "Seară jazz", venue: "Club Daos", address: "Str. Daos 1" }),
    ];
    await refresh(id);
    const rows = await staged();
    const ids = Object.fromEntries(rows.map((r) => [r.title, r.id]));

    const first = (await call("POST", "/api/admin/staged-events/accept", { ids: Object.values(ids) })).body;
    expect(first.accepted).toHaveLength(3);
    expect(first.skipped).toEqual([{ id: ids["Tur ghidat"], reason: expect.stringMatching(/needs a place/) }]);

    const museum = t.db.select().from(place).where(eq(place.name, "Muzeul de Artă Timișoara")).get()!;
    expect((await call("POST", `/api/admin/staged-events/${ids["Tur ghidat"]}/place`, { placeId: museum.id })).status).toBe(200);
    expect((await call("POST", "/api/admin/staged-events/accept", { ids: [ids["Tur ghidat"]] })).body.accepted).toHaveLength(1);

    expect(liveEvents()).toHaveLength(4);
    const venues = t.db.select().from(place).where(eq(place.source, "event-venue")).all();
    expect(venues).toHaveLength(1); // both Club Daos nights share one pin
    expect(venues[0]).toMatchObject({ name: "Club Daos", city: TM, isManualPin: false });

    // Live means public.
    const res = await t.app.inject({ method: "GET", url: `/api/places/${museum.id}/events` });
    expect(res.json().data.map((e: { title: string }) => e.title)).toContain("Tur ghidat");
  });

  it("drops a manual pin only inside the city, and marks the place as one", async () => {
    const id = await addSource();
    feed = [listing({ externalId: "u", title: "Undeva", venue: "Nicăieri cunoscut" })];
    await refresh(id);
    const [row] = await staged();
    expect((await call("POST", `/api/admin/staged-events/${row.id}/place`, { lat: 44.43, lng: 26.1 })).body.code).toBe("PIN_OUTSIDE_CITY");
    expect((await call("POST", `/api/admin/staged-events/${row.id}/place`, { lat: 45.76, lng: 21.24 })).status).toBe(200);
    await call("POST", "/api/admin/staged-events/accept", { ids: [row.id] });
    expect(t.db.select().from(place).where(eq(place.source, "event-venue")).get()).toMatchObject({ isManualPin: true });
  });

  it("a rejected listing stays rejected on later refreshes", async () => {
    const id = await addSource();
    feed = [listing()];
    await refresh(id);
    const [row] = await staged();
    expect((await call("POST", "/api/admin/staged-events/reject", { ids: [row.id] })).body).toEqual({ rejected: 1 });
    const again = await refresh(id);
    expect(again).toMatchObject({ new: 0, unchanged: 1 });
    expect(await staged()).toHaveLength(0);
  });
});

describe("reconcile on later refreshes", () => {
  async function acceptedListing() {
    const id = await addSource();
    feed = [listing()];
    await refresh(id);
    const [row] = await staged();
    await call("POST", "/api/admin/staged-events/accept", { ids: [row.id] });
    return { sourceId: id, stagedId: row.id as string };
  }

  it("updates price and links silently", async () => {
    const { sourceId } = await acceptedListing();
    feed = [listing({ price: 35 })];
    expect(await refresh(sourceId)).toMatchObject({ silentUpdates: 1, changed: 0 });
    expect(liveEvents()[0].price).toBe(35);
    expect(await staged()).toHaveLength(0);
  });

  it("sends a moved start time back for review, and applies it on accept", async () => {
    const { sourceId, stagedId } = await acceptedListing();
    feed = [listing({ startDate: "2026-10-11T16:00:00.000Z" })];
    expect(await refresh(sourceId)).toMatchObject({ changed: 1 });
    expect(liveEvents()[0].startDate).toBe("2026-10-10T16:00:00.000Z"); // unchanged until accepted
    expect((await staged("changed"))[0].id).toBe(stagedId);
    await call("POST", "/api/admin/staged-events/accept", { ids: [stagedId] });
    expect(liveEvents()).toHaveLength(1);
    expect(liveEvents()[0].startDate).toBe("2026-10-11T16:00:00.000Z");
  });

  it("a cancellation is a change, and accepting it ends the event", async () => {
    const { sourceId, stagedId } = await acceptedListing();
    feed = [listing({ cancelled: true })];
    expect(await refresh(sourceId)).toMatchObject({ changed: 1 });
    await call("POST", "/api/admin/staged-events/accept", { ids: [stagedId] });
    expect(liveEvents()[0].status).toBe("ended");
  });

  it("a vanished event turns stale only after the grace window, and comes back if relisted", async () => {
    const { sourceId } = await acceptedListing();
    feed = [];
    clock = new Date("2026-10-02T09:00:00.000Z");
    expect((await refresh(sourceId)).stale).toBe(0);
    clock = new Date("2026-10-05T10:00:00.000Z");
    expect((await refresh(sourceId)).stale).toBe(1);
    expect(liveEvents()[0].status).toBe("stale");

    feed = [listing()];
    await refresh(sourceId);
    expect(liveEvents()[0].status).toBe("live");
  });
});

describe("dedup across sources", () => {
  it("skips the same event from a second source, live or still waiting", async () => {
    const a = await addSource("test:a");
    const b = await addSource("test:b");
    feed = [listing()];
    await refresh(a);
    // Same title, same Bucharest day, another time and another UID.
    feed = [listing({ externalId: "other-uid", startDate: "2026-10-10T07:00:00.000Z" })];
    expect(await refresh(b)).toMatchObject({ new: 0, duplicates: 1 });
  });
});

describe("source health", () => {
  it("is suspect on an empty run or a big drop, and error when the source fails", async () => {
    const id = await addSource();
    feed = Array.from({ length: 10 }, (_, i) => listing({ externalId: `u${i}`, title: `Eveniment ${i}` }));
    expect((await refresh(id)).status).toBe("ok");
    feed = feed.slice(0, 3);
    expect((await refresh(id)).status).toBe("suspect");
    feed = [];
    expect((await refresh(id)).status).toBe("suspect");

    failNext = new Error("feed answered 503");
    expect(await refresh(id)).toMatchObject({ status: "error", error: "feed answered 503" });
    const [source] = (await call("GET", "/api/admin/sources")).body.data;
    expect(source.lastStatus).toBe("error");
  });

  it("refuses an adapter that has not cleared the legal posture, in production only", async () => {
    await t.close();
    await build(true);
    const id = await addSource("restricted:x");
    const res = await call("POST", `/api/admin/sources/${id}/refresh`);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("ADAPTER_NOT_ALLOWED");
  });
});
