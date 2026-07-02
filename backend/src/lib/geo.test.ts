import { describe, expect, it } from "vitest";
import { boundingBox } from "./geo.js";

describe("boundingBox", () => {
  it("brackets the point (min < value < max on both axes)", () => {
    const box = boundingBox(45.7489, 21.2087, 5);
    expect(box.minLat).toBeLessThan(45.7489);
    expect(box.maxLat).toBeGreaterThan(45.7489);
    expect(box.minLng).toBeLessThan(21.2087);
    expect(box.maxLng).toBeGreaterThan(21.2087);
  });

  it("widens with radius (~1 deg lat per 111 km)", () => {
    const box = boundingBox(0, 0, 111);
    expect(box.maxLat - box.minLat).toBeCloseTo(2, 1); // ±1 deg
  });

  it("stretches longitude more than latitude at high latitude (cos(lat) scaling)", () => {
    const box = boundingBox(60, 10, 10);
    const latSpan = box.maxLat - box.minLat;
    const lngSpan = box.maxLng - box.minLng;
    // at 60°N, cos(60°)=0.5 → longitude delta is ~2x the latitude delta
    expect(lngSpan).toBeGreaterThan(latSpan * 1.9);
  });

  it("is symmetric around the center point", () => {
    const lat = 44.4268;
    const lng = 26.1025;
    const box = boundingBox(lat, lng, 3);
    expect(box.maxLat - lat).toBeCloseTo(lat - box.minLat, 10);
    expect(box.maxLng - lng).toBeCloseTo(lng - box.minLng, 10);
  });
});
