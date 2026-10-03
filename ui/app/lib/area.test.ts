import { describe, expect, it } from "vitest";
import { inArea, pointInRing, type AreaRing } from "./area";

// A rough box around Timișoara's centre (lat 45.74–45.77, lng 21.20–21.25).
const box: AreaRing = [
  [45.74, 21.2],
  [45.77, 21.2],
  [45.77, 21.25],
  [45.74, 21.25],
];

describe("pointInRing (brief 15)", () => {
  it("finds a point inside and one outside a box", () => {
    expect(pointInRing({ lat: 45.755, lng: 21.225 }, box)).toBe(true);
    expect(pointInRing({ lat: 45.8, lng: 21.225 }, box)).toBe(false);
    expect(pointInRing({ lat: 45.755, lng: 21.3 }, box)).toBe(false);
  });

  it("handles a concave shape: the notch of a U is outside", () => {
    const u: AreaRing = [
      [0, 0],
      [3, 0],
      [3, 1],
      [1, 1],
      [1, 2],
      [3, 2],
      [3, 3],
      [0, 3],
    ];
    expect(pointInRing({ lat: 2, lng: 1.5 }, u)).toBe(false);
    expect(pointInRing({ lat: 0.5, lng: 1.5 }, u)).toBe(true);
    expect(pointInRing({ lat: 2, lng: 0.5 }, u)).toBe(true);
  });

  it("does not care which way the ring winds", () => {
    const reversed = [...box].reverse();
    expect(pointInRing({ lat: 45.755, lng: 21.225 }, reversed)).toBe(true);
  });

  it("follows even-odd on a self-crossing freehand loop", () => {
    // A bow tie: a top and a bottom triangle meeting at (1, 1).
    const bowTie: AreaRing = [
      [0, 0],
      [2, 2],
      [2, 0],
      [0, 2],
    ];
    expect(pointInRing({ lat: 1.7, lng: 1 }, bowTie)).toBe(true);
    expect(pointInRing({ lat: 0.3, lng: 1 }, bowTie)).toBe(true);
    expect(pointInRing({ lat: 1, lng: 0.2 }, bowTie)).toBe(false);
  });

  it("is never inside fewer than three vertices", () => {
    expect(pointInRing({ lat: 0, lng: 0 }, [[0, 0], [1, 1]])).toBe(false);
  });
});

describe("inArea", () => {
  it("passes everything when no area is drawn", () => {
    expect(inArea({ lat: 10, lng: 10 }, null)).toBe(true);
  });

  it("filters by the area when one is", () => {
    expect(inArea({ lat: 10, lng: 10 }, box)).toBe(false);
    expect(inArea({ lat: 45.75, lng: 21.21 }, box)).toBe(true);
  });
});
