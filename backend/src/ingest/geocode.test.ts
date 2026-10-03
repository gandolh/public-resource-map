import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildTestApp, type TestApp } from "../test/harness.js";
import { CITIES } from "../lib/osm-sync.js";
import { geocodeAddress, nominatimProvider, rejectReason, type GeocodeHit } from "./geocode.js";

const TM = CITIES.timisoara;
const hit = (over: Partial<GeocodeHit> = {}): GeocodeHit => ({
  lat: 45.75,
  lng: 21.23,
  importance: 0.2,
  granularity: "building",
  raw: {},
  ...over,
});

describe("rejectReason (brief 04: a geocode must earn its pin)", () => {
  it("accepts a building inside the city", () => {
    expect(rejectReason(hit(), TM)).toBeNull();
  });
  it("rejects a point outside the city, and a city-wide centroid", () => {
    expect(rejectReason(hit({ lat: 44.43, lng: 26.1 }), TM)).toMatch(/outside/);
    expect(rejectReason(hit({ granularity: "city" }), TM)).toMatch(/coarse/);
  });
});

describe("geocodeAddress", () => {
  let t: TestApp;
  beforeEach(async () => {
    t = await buildTestApp();
  });
  afterEach(async () => {
    await t.close();
  });

  it("asks once per normalized address, misses included", async () => {
    const asked: string[] = [];
    const provider = async (q: string) => {
      asked.push(q);
      return q.includes("Daos") ? hit() : hit({ granularity: "city" });
    };
    expect(await geocodeAddress(t.db, provider, "Str. Daos nr. 1", TM)).toEqual({ lat: 45.75, lng: 21.23 });
    expect(await geocodeAddress(t.db, provider, "Strada Daos 1", TM)).toEqual({ lat: 45.75, lng: 21.23 });
    expect(await geocodeAddress(t.db, provider, "Undeva", TM)).toBeNull();
    expect(await geocodeAddress(t.db, provider, "Undeva", TM)).toBeNull();
    expect(asked).toEqual(["Str. Daos nr. 1, Timișoara", "Undeva, Timișoara"]);
  });
});

describe("nominatimProvider", () => {
  it("is off without an identifying User-Agent", () => {
    expect(nominatimProvider({ userAgent: undefined })).toBeNull();
    expect(nominatimProvider({ userAgent: "  " })).toBeNull();
  });

  it("sends the User-Agent, bounds the search to the city, and spaces requests", async () => {
    const calls: { url: URL; ua: string | null; at: number }[] = [];
    const fetchImpl = (async (url: URL, init: RequestInit) => {
      const at = Date.now();
      calls.push({ url, ua: new Headers(init.headers).get("user-agent"), at });
      return new Response(JSON.stringify([{ lat: "45.75", lon: "21.23", importance: 0.3, addresstype: "building" }]));
    }) as unknown as typeof fetch;
    const provider = nominatimProvider({ userAgent: "prm-test/1 (ops@example.ro)", fetchImpl, minIntervalMs: 80 })!;

    const [a, b] = await Promise.all([provider("A, Timișoara", TM), provider("B, Timișoara", TM)]);
    expect(a).toMatchObject({ lat: 45.75, lng: 21.23, granularity: "building" });
    expect(b).not.toBeNull();
    expect(calls[0].ua).toBe("prm-test/1 (ops@example.ro)");
    expect(calls[0].url.searchParams.get("bounded")).toBe("1");
    expect(calls[0].url.searchParams.get("viewbox")).toBe("21.1,45.81,21.31,45.68");
    expect(calls[1].at - calls[0].at).toBeGreaterThanOrEqual(75);
  });
});
