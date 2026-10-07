import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { buildTestApp, type TestApp } from "../test/harness.js";
import { event, eventSource, place, stagedEvent } from "../db/schema.js";
import {
  CITIES,
  OverpassTimeoutError,
  SyncInProgressError,
  buildOverpassQuery,
  centroid,
  elementsToPlaces,
  resolveCity,
  syncOsmForCity,
  upsertOsmPlaces,
  type OverpassElement,
  type OverpassFetcher,
  type OverpassResponse,
} from "./osm-sync.js";

describe("centroid", () => {
  it("returns the point itself for a single point", () => {
    expect(centroid([{ lat: 45, lng: 21 }])).toEqual({ lat: 45, lng: 21 });
  });

  it("returns the midpoint for two points", () => {
    expect(centroid([{ lat: 0, lng: 0 }, { lat: 10, lng: 20 }])).toEqual({
      lat: 5,
      lng: 10,
    });
  });

  it("computes the area-weighted centroid of a square polygon", () => {
    const square = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 2 },
      { lat: 2, lng: 2 },
      { lat: 2, lng: 0 },
    ];
    const c = centroid(square);
    expect(c.lat).toBeCloseTo(1, 6);
    expect(c.lng).toBeCloseTo(1, 6);
  });

  it("falls back to the arithmetic mean for a degenerate (collinear) ring", () => {
    const line = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 2 },
      { lat: 0, lng: 4 },
    ];
    const c = centroid(line);
    expect(c.lat).toBeCloseTo(0, 6);
    expect(c.lng).toBeCloseTo(2, 6);
  });
});

describe("elementsToPlaces", () => {
  const elements: OverpassElement[] = [
    // node with a name + address → kept
    {
      type: "node",
      id: 1,
      lat: 45.75,
      lon: 21.22,
      tags: {
        name: "Central Library",
        amenity: "library",
        "addr:street": "Bulevardul Revoluției",
        "addr:housenumber": "8",
        website: "https://lib.example",
        opening_hours: "Mo-Fr 09:00-18:00",
      },
    },
    // way (polygon) with a name, no address → kept, lands at centroid
    {
      type: "way",
      id: 2,
      geometry: [
        { lat: 0, lon: 0 },
        { lat: 0, lon: 2 },
        { lat: 2, lon: 2 },
        { lat: 2, lon: 0 },
      ],
      tags: { name: "City Park", leisure: "park" },
    },
    // relation with `center` supplied by Overpass `out center`
    {
      type: "relation",
      id: 3,
      center: { lat: 44.43, lon: 26.1 },
      tags: { name: "Grand Museum", tourism: "museum" },
    },
    // un-named feature → dropped
    { type: "node", id: 4, lat: 45.7, lon: 21.2, tags: { amenity: "library" } },
    // unmapped tag → kept as `other`
    {
      type: "node",
      id: 5,
      lat: 45.71,
      lon: 21.21,
      tags: { name: "Corner Bakery", shop: "bakery" },
    },
    // no geometry at all → dropped
    { type: "way", id: 6, tags: { name: "Ghost Way", leisure: "park" } },
  ];

  it("normalizes kept features, drops un-named + geometry-less, keeps un-addressed", () => {
    const { places, skippedUnnamed, skippedNoGeometry } = elementsToPlaces(
      elements,
      "Timișoara",
    );

    expect(skippedUnnamed).toBe(1);
    expect(skippedNoGeometry).toBe(1);
    expect(places).toHaveLength(4);

    const byName = Object.fromEntries(places.map((p) => [p.name, p]));

    // node: full metadata
    expect(byName["Central Library"]).toMatchObject({
      category: "library",
      osmType: "node",
      osmId: "1",
      city: "Timișoara",
      lat: 45.75,
      lng: 21.22,
      address: "Bulevardul Revoluției 8",
      website: "https://lib.example",
      openingHours: "Mo-Fr 09:00-18:00",
    });

    // way: centroid of the square, no address (kept anyway)
    const park = byName["City Park"];
    expect(park.category).toBe("park");
    expect(park.address).toBeNull();
    expect(park.lat).toBeCloseTo(1, 6);
    expect(park.lng).toBeCloseTo(1, 6);

    // relation: uses `center`
    expect(byName["Grand Museum"]).toMatchObject({
      category: "museum",
      lat: 44.43,
      lng: 26.1,
    });

    // unmapped tag → other (visible, not dropped)
    expect(byName["Corner Bakery"].category).toBe("other");
  });
});

describe("buildOverpassQuery + resolveCity", () => {
  // Decided 2026-10-04: a city is its municipal boundary, not a box. The box
  // took in Giroc's and Dumbrăvița's town halls as Timișoara's.
  it("queries inside the city's administrative boundary, for every filter", () => {
    const q = buildOverpassQuery(CITIES.timisoara);
    expect(q).toContain("[out:json]");
    expect(q).toContain("out center tags;");
    // Overpass area ids are the relation id plus 3,600,000,000.
    expect(q).toContain("area(id:3606927733)->.city;");
    expect(q).toContain('node["amenity"="library"](area.city);');
    expect(q).toContain('way["leisure"="park"](area.city);');
    expect(q).toContain('relation["healthcare"~"^(hospital|clinic|centre)$"](area.city);');
    expect(q).not.toMatch(/\(\d+\.\d+,/);
    expect(buildOverpassQuery(CITIES.bucuresti)).toContain("area(id:3600377733)->.city;");
  });

  it("resolves a city by key or display name (diacritics-insensitive)", () => {
    expect(resolveCity("timisoara")?.name).toBe("Timișoara");
    expect(resolveCity("Timișoara")?.name).toBe("Timișoara");
    expect(resolveCity("BUCURESTI")?.name).toBe("București");
    expect(resolveCity("nowhere")).toBeNull();
  });
});

describe("upsertOsmPlaces + syncOsmForCity (no clobber)", () => {
  let t: TestApp;
  beforeEach(async () => {
    t = await buildTestApp();
  });
  afterEach(async () => {
    await t.close();
  });

  it("upserts osm rows without touching event-venue or manual-pin rows", async () => {
    // Seed: an event-venue place, an admin manual pin, and an existing osm row.
    const eventVenueId = randomUUID();
    const manualPinId = randomUUID();
    await t.db.insert(place).values([
      {
        id: eventVenueId,
        name: "Event Venue",
        category: "theater",
        source: "event-venue",
        city: "Timișoara",
        lat: 45.7,
        lng: 21.2,
      },
      {
        id: manualPinId,
        name: "Admin Manual Pin",
        category: "other",
        source: "osm",
        osmType: "node",
        osmId: "999",
        isManualPin: true,
        city: "Timișoara",
        lat: 45.71,
        lng: 21.21,
      },
      {
        id: randomUUID(),
        name: "Old Library Name",
        category: "library",
        source: "osm",
        osmType: "node",
        osmId: "1",
        isManualPin: false,
        city: "Timișoara",
        lat: 45.75,
        lng: 21.22,
      },
    ]);

    // A re-sync that renames osm node 1, re-touches the protected manual pin,
    // and inserts a brand-new osm node 2.
    const result = await upsertOsmPlaces(t.db, [
      {
        name: "Central Library (renamed)",
        description: null,
        category: "library",
        osmType: "node",
        osmId: "1",
        address: null,
        city: "Timișoara",
        lat: 45.751,
        lng: 21.221,
        website: null,
        phone: null,
        openingHours: null,
      },
      {
        name: "Manual Pin From OSM",
        description: null,
        category: "park",
        osmType: "node",
        osmId: "999",
        address: null,
        city: "Timișoara",
        lat: 0,
        lng: 0,
        website: null,
        phone: null,
        openingHours: null,
      },
      {
        name: "New Museum",
        description: null,
        category: "museum",
        osmType: "node",
        osmId: "2",
        address: null,
        city: "Timișoara",
        lat: 45.76,
        lng: 21.23,
        website: null,
        phone: null,
        openingHours: null,
      },
    ]);

    expect(result).toEqual({ inserted: 1, updated: 1, skippedProtected: 1, unretired: 0 });

    // event-venue row untouched
    const ev = await t.db
      .select()
      .from(place)
      .where(eq(place.id, eventVenueId))
      .get();
    expect(ev?.name).toBe("Event Venue");
    expect(ev?.source).toBe("event-venue");

    // manual pin untouched (name + coords preserved)
    const mp = await t.db
      .select()
      .from(place)
      .where(eq(place.id, manualPinId))
      .get();
    expect(mp?.name).toBe("Admin Manual Pin");
    expect(mp?.lat).toBe(45.71);

    // osm node 1 updated in place
    const lib = await t.db
      .select()
      .from(place)
      .where(and(eq(place.osmType, "node"), eq(place.osmId, "1")))
      .get();
    expect(lib?.name).toBe("Central Library (renamed)");
    expect(lib?.lat).toBeCloseTo(45.751, 6);
  });

  it("syncOsmForCity fetches via the injected stub (no real Overpass)", async () => {
    const fixture: OverpassResponse = {
      elements: [
        {
          type: "node",
          id: 10,
          lat: 45.75,
          lon: 21.22,
          tags: { name: "Biblioteca", amenity: "library" },
        },
        // un-named → dropped
        { type: "node", id: 11, lat: 45.7, lon: 21.2, tags: { leisure: "park" } },
      ],
    };
    let receivedQuery = "";
    const result = await syncOsmForCity(t.db, CITIES.timisoara, {
      fetchOverpass: async (q) => {
        receivedQuery = q;
        return fixture;
      },
    });

    expect(receivedQuery).toContain("out center tags;");
    expect(result).toMatchObject({
      city: "Timișoara",
      fetched: 2,
      inserted: 1,
      updated: 0,
      upserted: 1,
      skippedUnnamed: 1,
    });

    const rows = await t.db.select().from(place);
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("Biblioteca");
    expect(rows[0].source).toBe("osm");
  });
});

describe("syncOsmForCity: timeout and one sync per city (brief 33)", () => {
  let t: TestApp;
  beforeEach(async () => {
    t = await buildTestApp();
  });
  afterEach(async () => {
    await t.close();
  });

  const library: OverpassResponse = {
    elements: [
      { type: "node", id: 10, lat: 45.75, lon: 21.22, tags: { name: "Biblioteca", amenity: "library" } },
    ],
  };

  /** An Overpass that answers only when told to. */
  function heldOverpass() {
    let answer!: (r: OverpassResponse) => void;
    let calls = 0;
    const fetcher: OverpassFetcher = () => {
      calls++;
      return new Promise((resolve) => {
        answer = resolve;
      });
    };
    return { fetcher, answer: (r: OverpassResponse) => answer(r), calls: () => calls };
  }

  /** An Overpass that never answers; it gives up only when the signal fires, as fetch does. */
  const hungOverpass: OverpassFetcher = (_query, signal) =>
    new Promise((_resolve, reject) => {
      signal?.addEventListener("abort", () => reject(signal.reason));
    });

  it("gives up on an Overpass that does not answer, writes nothing, and frees the city", async () => {
    await expect(
      syncOsmForCity(t.db, CITIES.timisoara, { fetchOverpass: hungOverpass, timeoutMs: 20 }),
    ).rejects.toBeInstanceOf(OverpassTimeoutError);
    expect(await t.db.select().from(place)).toHaveLength(0);

    const again = await syncOsmForCity(t.db, CITIES.timisoara, { fetchOverpass: async () => library });
    expect(again.inserted).toBe(1);
  });

  it("passes the real fetcher an abort signal", async () => {
    let received: AbortSignal | undefined;
    await syncOsmForCity(t.db, CITIES.timisoara, {
      fetchOverpass: async (_q, signal) => {
        received = signal;
        return library;
      },
    });
    expect(received).toBeInstanceOf(AbortSignal);
    expect(received?.aborted).toBe(false);
  });

  it("refuses a second sync of a city that is still syncing, but not another city", async () => {
    const held = heldOverpass();
    const first = syncOsmForCity(t.db, CITIES.timisoara, { fetchOverpass: held.fetcher });

    await expect(
      syncOsmForCity(t.db, CITIES.timisoara, { fetchOverpass: async () => library }),
    ).rejects.toBeInstanceOf(SyncInProgressError);
    const other = await syncOsmForCity(t.db, CITIES.bucuresti, { fetchOverpass: async () => ({ elements: [] }) });
    expect(other.city).toBe("București");

    held.answer(library);
    expect((await first).inserted).toBe(1);
    expect(held.calls()).toBe(1);

    const after = await syncOsmForCity(t.db, CITIES.timisoara, { fetchOverpass: async () => library });
    expect(after.updated).toBe(1);
  });

  it("frees the city after a failed sync", async () => {
    await expect(
      syncOsmForCity(t.db, CITIES.timisoara, {
        fetchOverpass: async () => {
          throw new Error("Overpass request failed (429)");
        },
      }),
    ).rejects.toThrow("429");
    const again = await syncOsmForCity(t.db, CITIES.timisoara, { fetchOverpass: async () => library });
    expect(again.inserted).toBe(1);
  });
});

describe("syncOsmForCity: retiring places OSM no longer has (brief 34)", () => {
  let t: TestApp;
  beforeEach(async () => {
    t = await buildTestApp();
  });
  afterEach(async () => {
    await t.close();
  });

  /** Libraries with OSM node ids `ids`, as Overpass would answer. */
  const answer = (ids: number[]): OverpassResponse => ({
    elements: ids.map((id) => ({
      type: "node" as const,
      id,
      lat: 45.75 + id / 10_000,
      lon: 21.22,
      tags: { name: `Biblioteca ${id}`, amenity: "library" },
    })),
  });
  const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1);
  const sync = (ids: number[]) =>
    syncOsmForCity(t.db, CITIES.timisoara, { fetchOverpass: async () => answer(ids) });
  const byOsmId = (osmId: string) =>
    t.db.select().from(place).where(and(eq(place.source, "osm"), eq(place.osmId, osmId))).get();
  const listedIds = async () =>
    (await t.db.select({ osmId: place.osmId }).from(place).where(isNull(place.retiredAt)).all()).map((r) => r.osmId);

  it("retires a place missing from the next answer, and lists it again when it is back", async () => {
    await sync(range(20));
    const second = await sync(range(20).filter((id) => id !== 5));
    expect(second).toMatchObject({ retired: 1, unretired: 0, retirementHeld: 0 });

    const gone = await byOsmId("5");
    expect(gone?.retiredAt).not.toBeNull(); // the row stays
    expect(await listedIds()).not.toContain("5");
    const res = await t.app.inject({ method: "GET", url: `/api/places/${gone!.id}` });
    expect(res.statusCode).toBe(404);

    const third = await sync(range(20));
    expect(third).toMatchObject({ retired: 0, unretired: 1 });
    expect((await byOsmId("5"))?.retiredAt).toBeNull();
    expect((await byOsmId("5"))?.id).toBe(gone!.id);
  });

  it("never retires a manual pin, an event venue, or another city's place", async () => {
    await t.db.insert(place).values([
      { id: "venue", name: "Club", category: "other", source: "event-venue", city: "Timișoara", lat: 45.7, lng: 21.2 },
      {
        id: "pin", name: "Pinned by hand", category: "other", source: "osm", osmType: "node", osmId: "999",
        isManualPin: true, city: "Timișoara", lat: 45.71, lng: 21.21,
      },
      {
        id: "buc", name: "Biblioteca din București", category: "library", source: "osm", osmType: "node",
        osmId: "777", city: "București", lat: 44.43, lng: 26.1,
      },
    ]);
    await sync(range(20));
    const again = await sync(range(20));
    expect(again.retired).toBe(0);
    const kept = await t.db.select({ id: place.id, retiredAt: place.retiredAt }).from(place).all();
    for (const id of ["venue", "pin", "buc"]) {
      expect(kept.find((p) => p.id === id)?.retiredAt, id).toBeNull();
    }
  });

  it("retires nothing when the answer would retire more than 10% of the city, and says so", async () => {
    await sync(range(20));
    const truncated = await sync(range(17)); // 3 of 20 missing: 15%
    expect(truncated).toMatchObject({ retired: 0, retirementHeld: 3 });
    expect(await listedIds()).toHaveLength(20);

    const empty = await sync([]); // a failed query that still answered
    expect(empty).toMatchObject({ retired: 0, retirementHeld: 20 });
    expect(await listedIds()).toHaveLength(20);

    const two = await sync(range(18)); // 2 of 20: exactly 10% is allowed
    expect(two).toMatchObject({ retired: 2, retirementHeld: 0 });
  });

  it("sends upcoming events at a retired place back to review, and leaves past ones", async () => {
    await sync(range(20));
    const lib = (await byOsmId("5"))!;
    await t.db.insert(eventSource).values({ id: "src", name: "Feed", adapterKey: "ical:feed", mechanism: "ical", city: "Timișoara" });
    const day = 86_400_000;
    await t.db.insert(event).values([
      { id: "soon", placeId: lib.id, title: "Lectură", category: "community", startDate: new Date(Date.now() + day).toISOString() },
      { id: "past", placeId: lib.id, title: "Lectură veche", category: "community", startDate: new Date(Date.now() - day).toISOString() },
    ]);
    await t.db.insert(stagedEvent).values(
      ["soon", "past"].map((id) => ({
        id: `staged-${id}`, sourceId: "src", placeId: lib.id, eventId: id, matchStatus: "auto-matched",
        status: "accepted", title: id, startDate: new Date().toISOString(), payload: JSON.stringify({ title: id }),
      })),
    );

    const result = await sync(range(20).filter((id) => id !== 5));
    expect(result).toMatchObject({ retired: 1, eventsToReview: 1 });

    const soon = await t.db.select().from(stagedEvent).where(eq(stagedEvent.id, "staged-soon")).get();
    expect(soon).toMatchObject({ status: "changed", placeId: null, matchStatus: "unmatched" });
    expect(JSON.parse(soon!.payload!).issues).toMatch(/Biblioteca 5.*no longer in OpenStreetMap/);
    const past = await t.db.select().from(stagedEvent).where(eq(stagedEvent.id, "staged-past")).get();
    expect(past?.status).toBe("accepted");

    // In the review queue, with its reason.
    const token = randomUUID();
    t.ward.signIn(token, "admin-1", { prm: ["admin"] });
    const queue = await t.app.inject({ method: "GET", url: "/api/admin/staged-events", headers: { cookie: `ward_session=${token}` } });
    const row = (queue.json() as { data: { id: string; issues: string | null }[] }).data.find((r) => r.id === "staged-soon");
    expect(row?.issues).toMatch(/retired/);
  });
});
