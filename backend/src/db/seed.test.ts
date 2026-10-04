import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { asc, eq, isNotNull, isNull } from "drizzle-orm";
import { createDb } from "./index.js";
import { event, favoriteEvent, favoritePlace, notification, place } from "./schema.js";
import { seedDatabase } from "./seed-data.js";
import { SEED, seedId } from "./seed-ids.js";

const migrationsFolder = fileURLToPath(new URL("../../drizzle", import.meta.url));
const NOW = new Date("2026-10-04T09:00:00Z");

function freshDb() {
  const { db } = createDb(":memory:");
  migrate(db, { migrationsFolder });
  return db;
}

const ids = (db: ReturnType<typeof freshDb>) => ({
  places: db.select({ id: place.id }).from(place).orderBy(asc(place.id)).all(),
  events: db.select({ id: event.id }).from(event).orderBy(asc(event.id)).all(),
});

// Brief 08: the seed is the state dev, e2e and demos start from.
describe("db:seed", () => {
  it("names a row by what it is, the same way every time", () => {
    expect(seedId("osm:node/1")).toBe(seedId("osm:node/1"));
    expect(seedId("osm:node/1")).not.toBe(seedId("osm:way/1"));
    expect(seedId("osm:node/1")).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it("lands the same rows under the same ids on every run, without duplicating", () => {
    const db = freshDb();
    seedDatabase(db, { now: NOW });
    const first = ids(db);
    seedDatabase(db, { now: NOW });
    expect(ids(db)).toEqual(first);

    const other = freshDb();
    seedDatabase(other, { now: NOW });
    expect(ids(other)).toEqual(first);
  });

  it("loads both cities from the OSM fixture, plus a venue OSM does not have", () => {
    const db = freshDb();
    const r = seedDatabase(db, { now: NOW });
    const cities = new Set(db.select({ city: place.city }).from(place).all().map((p) => p.city));
    expect(cities).toEqual(new Set(["Timișoara", "București"]));
    expect(r.places).toBeGreaterThan(1000);
    const venue = db.select().from(place).where(eq(place.id, SEED.places.tmPiataVictoriei)).get();
    expect(venue).toMatchObject({ source: "event-venue", osmId: null });
    for (const id of Object.values(SEED.places)) {
      expect(db.select().from(place).where(eq(place.id, id)).get(), id).toBeDefined();
    }
  });

  it("has events with and without a ticket link, all live and attached", () => {
    const db = freshDb();
    seedDatabase(db, { now: NOW });
    expect(db.select().from(event).where(isNotNull(event.buyUrl)).all().length).toBeGreaterThan(0);
    expect(db.select().from(event).where(isNull(event.buyUrl)).all().length).toBeGreaterThan(0);
    expect(new Set(db.select({ s: event.status }).from(event).all().map((e) => e.s))).toEqual(new Set(["live"]));
    expect(db.select().from(event).where(eq(event.placeId, SEED.places.tmPiataVictoriei)).all()).toHaveLength(1);
  });

  it("resets what a previous run or a person added", () => {
    const db = freshDb();
    seedDatabase(db, { now: NOW, demoSubject: "ward|demo" });
    db.insert(favoritePlace).values({ subject: "ward|other", placeId: SEED.places.buArtMuseum }).run();
    seedDatabase(db, { now: NOW });
    expect(db.select().from(favoritePlace).all()).toEqual([]);
    expect(db.select().from(notification).all()).toEqual([]);
  });

  it("gives a named demo subject favourites and one new-events item", () => {
    const db = freshDb();
    seedDatabase(db, { now: NOW, demoSubject: "ward|demo" });
    const followed = db.select({ placeId: favoritePlace.placeId }).from(favoritePlace).all();
    expect(followed.map((f) => f.placeId).sort()).toEqual([SEED.places.tmArtMuseum, SEED.places.buArtMuseum].sort());
    expect(db.select().from(favoriteEvent).all()).toHaveLength(1);
    expect(db.select().from(notification).all()).toEqual([
      expect.objectContaining({ subject: "ward|demo", kind: "new-event", placeId: SEED.places.tmArtMuseum }),
    ]);
  });
});
