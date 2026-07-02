import { describe, expect, it } from "vitest";
import {
  createPlaceSchema,
  placeCategorySchema,
  placeSchema,
  placeSourceSchema,
} from "./place.js";

describe("placeCategorySchema", () => {
  it("accepts a known category and rejects an unknown one", () => {
    expect(placeCategorySchema.safeParse("library").success).toBe(true);
    expect(placeCategorySchema.safeParse("restaurant").success).toBe(false);
  });
});

describe("placeSourceSchema", () => {
  it("accepts only 'osm' | 'event-venue'", () => {
    expect(placeSourceSchema.safeParse("osm").success).toBe(true);
    expect(placeSourceSchema.safeParse("event-venue").success).toBe(true);
    expect(placeSourceSchema.safeParse("scrape").success).toBe(false);
  });
});

describe("placeSchema", () => {
  const base = {
    id: "p1",
    name: "Park",
    description: null,
    category: "park",
    source: "osm",
    osmType: null,
    osmId: null,
    isManualPin: false,
    address: null,
    city: "Timișoara",
    coordinates: { lat: 45.75, lng: 21.2 },
    website: null,
    phone: null,
    openingHours: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  it("accepts a fully-formed place with nullable fields as null", () => {
    expect(placeSchema.safeParse(base).success).toBe(true);
  });

  it("rejects coordinates outside the valid lat/lng range", () => {
    expect(
      placeSchema.safeParse({ ...base, coordinates: { lat: 91, lng: 21.2 } })
        .success,
    ).toBe(false);
    expect(
      placeSchema.safeParse({ ...base, coordinates: { lat: 45, lng: 181 } })
        .success,
    ).toBe(false);
  });

  it("rejects an omitted nullable field (null is required, undefined is not)", () => {
    const { description, ...withoutDescription } = base;
    expect(placeSchema.safeParse(withoutDescription).success).toBe(false);
  });
});

describe("createPlaceSchema", () => {
  it("defaults source to 'event-venue' when omitted", () => {
    const parsed = createPlaceSchema.parse({
      name: "New Venue",
      category: "theater",
      city: "București",
      lat: 44.4268,
      lng: 26.1025,
    });
    expect(parsed.source).toBe("event-venue");
  });

  it("rejects an empty name and a blank city", () => {
    expect(
      createPlaceSchema.safeParse({
        name: "",
        category: "theater",
        city: "București",
        lat: 44.4,
        lng: 26.1,
      }).success,
    ).toBe(false);
    expect(
      createPlaceSchema.safeParse({
        name: "Venue",
        category: "theater",
        city: "",
        lat: 44.4,
        lng: 26.1,
      }).success,
    ).toBe(false);
  });

  it("rejects an out-of-range latitude and a non-URL website", () => {
    expect(
      createPlaceSchema.safeParse({
        name: "Venue",
        category: "theater",
        city: "București",
        lat: 200,
        lng: 26.1,
      }).success,
    ).toBe(false);
    expect(
      createPlaceSchema.safeParse({
        name: "Venue",
        category: "theater",
        city: "București",
        lat: 44.4,
        lng: 26.1,
        website: "not-a-url",
      }).success,
    ).toBe(false);
  });
});
