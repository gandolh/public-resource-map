import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { buildTestApp, type TestApp } from "../test/harness.js";
import { place } from "../db/schema.js";

const COUNT = 1050;

// Brief 20: the map took one 1000-row page as the whole city, and the list
// query had no ORDER BY, so which rows came back (and whether two pages
// overlapped) was up to SQLite's scan order.
describe("places paging", () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await buildTestApp();
    const rows = Array.from({ length: COUNT }, (_, i) => ({
      id: randomUUID(), name: `Loc ${i}`, category: "park", source: "osm",
      city: "Iași", lat: 47.15 + i / 100_000, lng: 27.58,
    }));
    // Chunked: SQLite caps bound parameters per statement.
    for (let i = 0; i < rows.length; i += 200) {
      await t.db.insert(place).values(rows.slice(i, i + 200));
    }
  });

  afterAll(async () => {
    await t.close();
  });

  async function ids(page: number): Promise<string[]> {
    const res = await t.app.inject({
      method: "GET",
      url: `/api/places?city=Iași&page=${page}&pageSize=1000`,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().total).toBe(COUNT);
    return res.json().data.map((p: { id: string }) => p.id);
  }

  it("two pages are disjoint and together hold every place", async () => {
    const [one, two] = [await ids(1), await ids(2)];
    expect(one).toHaveLength(1000);
    expect(two).toHaveLength(50);
    const union = new Set([...one, ...two]);
    expect(union.size).toBe(COUNT);
  });

  it("the same request returns the same order", async () => {
    expect(await ids(1)).toEqual(await ids(1));
    expect(await ids(2)).toEqual(await ids(2));
  });

  // Repeatability alone would pass without the ORDER BY: SQLite's plain scan
  // happens to follow insertion order today. The order is the contract, so pin
  // it: by id, across the page boundary.
  it("orders by id, across the page boundary", async () => {
    const all = [...(await ids(1)), ...(await ids(2))];
    expect(all).toEqual([...all].sort());
  });
});
