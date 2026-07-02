import { describe, expect, it } from "vitest";
import {
  createEventSchema,
  eventCategorySchema,
  eventSchema,
  eventStatusSchema,
} from "./event.js";

describe("eventCategorySchema / eventStatusSchema", () => {
  it("accepts known enum members and rejects unknown ones", () => {
    expect(eventCategorySchema.safeParse("concert").success).toBe(true);
    expect(eventCategorySchema.safeParse("party").success).toBe(false);
    expect(eventStatusSchema.safeParse("past").success).toBe(true);
    expect(eventStatusSchema.safeParse("cancelled").success).toBe(false);
  });
});

describe("eventSchema", () => {
  const base = {
    id: "e1",
    placeId: "p1",
    title: "Show",
    description: null,
    category: "theater",
    status: "live",
    startDate: "2026-08-01T18:00:00.000Z",
    endDate: null,
    buyUrl: null,
    sourceUrl: null,
    sourcePlatform: null,
    imageUrl: null,
    price: null,
    currency: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  it("accepts a well-formed event", () => {
    expect(eventSchema.safeParse(base).success).toBe(true);
  });

  it("rejects a non-numeric price", () => {
    expect(eventSchema.safeParse({ ...base, price: "free" }).success).toBe(false);
  });
});

describe("createEventSchema", () => {
  const valid = {
    placeId: "p1",
    title: "Show",
    category: "theater",
    startDate: "2026-08-01T18:00:00.000Z",
  };

  it("defaults status to 'live' when omitted", () => {
    expect(createEventSchema.parse(valid).status).toBe("live");
  });

  it("rejects a non-datetime startDate", () => {
    expect(
      createEventSchema.safeParse({ ...valid, startDate: "2026-08-01" }).success,
    ).toBe(false);
  });

  it("rejects a negative price and a 2-letter currency", () => {
    expect(createEventSchema.safeParse({ ...valid, price: -5 }).success).toBe(
      false,
    );
    expect(createEventSchema.safeParse({ ...valid, currency: "RO" }).success).toBe(
      false,
    );
  });

  it("rejects an empty title", () => {
    expect(createEventSchema.safeParse({ ...valid, title: "" }).success).toBe(
      false,
    );
  });
});
