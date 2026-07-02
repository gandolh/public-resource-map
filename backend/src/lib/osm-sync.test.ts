import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { buildTestApp, type TestApp } from "../test/harness.js";
import { place } from "../db/schema.js";
import {
  CITIES,
  buildOverpassQuery,
  centroid,
  elementsToPlaces,
  resolveCity,
  syncOsmForCity,
  upsertOsmPlaces,
  type OverpassElement,
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
  it("builds a bbox query covering node/way/relation for every filter", () => {
    const q = buildOverpassQuery(CITIES.timisoara.bbox);
    expect(q).toContain("[out:json]");
    expect(q).toContain("out center tags;");
    expect(q).toContain('node["amenity"="library"](45.68,21.1,45.81,21.31);');
    expect(q).toContain('way["leisure"="park"](45.68,21.1,45.81,21.31);');
    expect(q).toContain('relation["healthcare"](45.68,21.1,45.81,21.31);');
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

    expect(result).toEqual({ inserted: 1, updated: 1, skippedProtected: 1 });

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
