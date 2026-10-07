import { describe, expect, it } from "vitest";
import type { ZodTypeAny } from "zod";
import { httpUrlSchema } from "./common.js";
import { createEventSchema } from "./event.js";
import { createSourceSchema, rawEventSchema } from "./ingest.js";
import { createPlaceSchema } from "./place.js";

const event = {
  placeId: "p1",
  title: "Show",
  category: "theater",
  startDate: "2026-08-01T18:00:00.000Z",
};
const place = { name: "Venue", category: "theater", city: "Timișoara", lat: 45.75, lng: 21.2 };
const raw = { title: "Show", startDate: "2026-08-01T21:00:00+03:00", venue: "Sala Mare" };
const source = { name: "Feed", adapterKey: "ical:feed", mechanism: "ical", city: "Timișoara" };

/** Every stored link field (brief 33): the schema, a valid row without it, the field. */
const fields: [string, ZodTypeAny, Record<string, unknown>, string][] = [
  ["createEvent.buyUrl", createEventSchema, event, "buyUrl"],
  ["createEvent.sourceUrl", createEventSchema, event, "sourceUrl"],
  ["createEvent.imageUrl", createEventSchema, event, "imageUrl"],
  ["createPlace.website", createPlaceSchema, place, "website"],
  ["rawEvent.buyUrl", rawEventSchema, raw, "buyUrl"],
  ["rawEvent.sourceUrl", rawEventSchema, raw, "sourceUrl"],
  ["createSource.url", createSourceSchema, source, "url"],
];

describe("httpUrlSchema", () => {
  it("accepts http and https", () => {
    expect(httpUrlSchema.safeParse("https://example.ro/a?b=1").success).toBe(true);
    expect(httpUrlSchema.safeParse("http://example.ro").success).toBe(true);
  });

  it("rejects other schemes and non-URLs", () => {
    for (const bad of ["javascript:alert(1)", "data:text/html,<b>x</b>", "ftp://x.ro", "nope"]) {
      expect(httpUrlSchema.safeParse(bad).success, bad).toBe(false);
    }
  });
});

describe.each(fields)("%s", (_name, schema, base, field) => {
  it("is valid without the link", () => {
    expect(schema.safeParse(base).success).toBe(true);
  });

  it("accepts an https link", () => {
    expect(schema.safeParse({ ...base, [field]: "https://example.ro/x" }).success).toBe(true);
  });

  it("rejects javascript: and data: links", () => {
    expect(schema.safeParse({ ...base, [field]: "javascript:alert(1)" }).success).toBe(false);
    expect(schema.safeParse({ ...base, [field]: "data:text/html,<script>alert(1)</script>" }).success).toBe(false);
  });
});
