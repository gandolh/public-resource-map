import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { SOURCES, type Reuse, type SourceId, type SourceRegistry } from "@public-resource-map/shared";
import { buildApp } from "../../app.js";
import { runReminderSweep } from "../../features/reminders/reminder-sweep.js";
import { buildTestApp, type TestApp } from "../harness.js";
import { event, eventSource, place, stagedEvent } from "../../db/schema.js";

const DAY = 86_400_000;
const at = (ms: number) => new Date(Date.now() + ms).toISOString();
const TM = "Timișoara";

/** The registry with some publishers' reuse changed: the code change an admin's flip is. */
const withReuse = (flips: Partial<Record<SourceId, Reuse>>): SourceRegistry =>
  SOURCES.map((s) => ({ ...s, reuse: flips[s.id] ?? s.reuse }));

/** Filarmonica's terms unsettled: published and credited all the same. iaBilet forbidden, as it is. */
const PENDING = withReuse({ "filarmonica-banatul": "permission-pending" });
/** And then the theatre objects: its rows must leave, including ones already published. */
const THEATRE_OBJECTS = withReuse({
  "filarmonica-banatul": "permission-pending",
  "teatrul-national-timisoara": "forbidden",
});

// The registry decides what the public sees, at read time: nothing is deleted, so a flip back
// brings the rows back. Every app here reads the same database.
describe("the source registry on the public API", () => {
  let t: TestApp;
  let other: FastifyInstance | null = null;
  let app: FastifyInstance;
  let cookie: string;

  /** Serve the same database under another registry. */
  async function serve(sources: SourceRegistry) {
    await other?.close();
    other = (await buildApp(t.context.config, { db: { db: t.db, sqlite: t.sqlite }, ward: null, sources })).app;
    await other.ready();
    app = other;
  }

  beforeAll(async () => {
    t = await buildTestApp({ sources: PENDING });
    app = t.app;
    t.db
      .insert(place)
      .values([
        // An OSM library, and two venues ingestion made: one from iaBilet's events, one from the theatre's.
        {
          id: "library",
          name: "Biblioteca",
          category: "library",
          source: "osm",
          osmType: "node",
          osmId: "1",
          city: TM,
          lat: 45.75,
          lng: 21.22,
        },
        {
          id: "ia-venue",
          name: "Club iaBilet",
          category: "other",
          source: "event-venue",
          city: TM,
          lat: 45.751,
          lng: 21.221,
        },
        {
          id: "tntm-venue",
          name: "Sala 2",
          category: "other",
          source: "event-venue",
          city: TM,
          lat: 45.752,
          lng: 21.222,
        },
        // A venue both iaBilet's and the Filarmonica's events point at.
        {
          id: "mixed-venue",
          name: "Sala Capitol",
          category: "other",
          source: "event-venue",
          city: TM,
          lat: 45.753,
          lng: 21.223,
        },
      ])
      .run();
    t.db
      .insert(eventSource)
      .values([
        {
          id: "fb",
          name: "Filarmonica",
          adapterKey: "ical:fb",
          mechanism: "ical",
          url: "https://filarmonicabanatul.ro/evenimente/?ical=1",
          city: TM,
        },
        {
          id: "tntm",
          name: "TNTM",
          adapterKey: "ical:teatru",
          mechanism: "ical",
          url: "https://www.tntm.ro/?ical=1",
          city: TM,
        },
        {
          id: "ia",
          name: "iaBilet",
          adapterKey: "iabilet:tm",
          mechanism: "html",
          url: "https://www.iabilet.ro/bilete-timisoara/",
          city: TM,
        },
      ])
      .run();
    const published: [string, string, string][] = [
      ["concert", "library", "fb"],
      ["ia-at-library", "library", "ia"],
      ["fb-at-capitol", "mixed-venue", "fb"],
      ["ia-at-capitol", "mixed-venue", "ia"],
      ["ia-at-venue", "ia-venue", "ia"],
      ["play", "tntm-venue", "tntm"],
    ];
    t.db
      .insert(event)
      .values([
        ...published.map(([id, placeId]) => ({ id, placeId, title: id, category: "concert", startDate: at(DAY) })),
        // Seeded, or made by hand: no source row published it.
        { id: "seeded", placeId: "library", title: "seeded", category: "community", startDate: at(DAY) },
        { id: "ia-past", placeId: "library", title: "ia-past", category: "concert", startDate: at(-2 * DAY) },
      ])
      .run();
    t.db
      .insert(stagedEvent)
      .values(
        [...published, ["ia-past", "library", "ia"] as [string, string, string]].map(([id, placeId, sourceId]) => ({
          id: `staged-${id}`,
          sourceId,
          placeId,
          eventId: id,
          matchStatus: "auto-matched",
          status: "accepted",
          title: id,
          startDate: at(DAY),
        })),
      )
      .run();
    cookie = (await t.signIn("user")).cookie;
  });

  afterAll(async () => {
    await other?.close();
    await t.close();
  });

  const get = async (url: string) => {
    const res = await app.inject({ method: "GET", url, headers: { cookie } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- response bodies are untyped JSON that the tests read freely
    return { status: res.statusCode, body: res.json() as any };
  };
  const placesById = async () => {
    const { body } = await get(`/api/places?city=${encodeURIComponent(TM)}`);
    return new Map(
      (body.data as { id: string; credits: string[]; upcomingEventCount: number }[]).map((p) => [p.id, p]),
    );
  };
  const whatsOn = async () =>
    new Map(
      (
        (await get(`/api/whats-on?city=${encodeURIComponent(TM)}`)).body.data as {
          event: { id: string; credit: string | null };
        }[]
      ).map((r) => [r.event.id, r.event.credit]),
    );

  it("publishes a permission-pending source's event, credited to it", async () => {
    const programme = await get("/api/places/library/events");
    const credits = new Map(
      (programme.body.data as { id: string; credit: string | null }[]).map((e) => [e.id, e.credit]),
    );
    expect(credits).toEqual(
      new Map([
        ["concert", "filarmonica-banatul"],
        ["seeded", null],
      ]),
    );
    expect((await get("/api/events/concert")).body.credit).toBe("filarmonica-banatul");
    expect((await whatsOn()).get("concert")).toBe("filarmonica-banatul");
  });

  it("credits a place to OpenStreetMap or to the publishers whose events made it", async () => {
    const places = await placesById();
    expect(places.get("library")?.credits).toEqual(["openstreetmap"]);
    expect(places.get("tntm-venue")?.credits).toEqual(["teatrul-national-timisoara"]);
    expect((await get("/api/places/tntm-venue")).body.credits).toEqual(["teatrul-national-timisoara"]);
  });

  it("keeps a venue a permitted source also uses, credited to that source alone", async () => {
    const places = await placesById();
    expect(places.get("mixed-venue")?.credits).toEqual(["filarmonica-banatul"]);
    expect(places.get("mixed-venue")?.upcomingEventCount).toBe(1);
    const programme = (await get("/api/places/mixed-venue/events")).body.data as { id: string }[];
    expect(programme.map((e) => e.id)).toEqual(["fb-at-capitol"]);
  });

  it("never publishes a forbidden source's row, nor a venue only it made", async () => {
    const places = await placesById();
    expect(places.has("ia-venue")).toBe(false);
    // The pin counts the concert and the seeded event, not iaBilet's.
    expect(places.get("library")?.upcomingEventCount).toBe(2);
    expect((await get("/api/places/ia-venue")).status).toBe(404);
    expect((await get("/api/places/ia-venue/events")).status).toBe(404);
    expect((await get("/api/events/ia-at-library")).status).toBe(404);
    const listed = await whatsOn();
    expect(listed.has("ia-at-library")).toBe(false);
    expect(listed.has("ia-at-venue")).toBe(false);
    const nearby = (await get("/api/events?lat=45.75&lng=21.22&radiusKm=5")).body.data as { id: string }[];
    expect(nearby.map((e) => e.id).sort()).toEqual(["concert", "fb-at-capitol", "play", "seeded"]);
    const archive = (await get("/api/archive")).body.data as unknown[];
    expect(archive).toEqual([]);
    const save = await app.inject({ method: "POST", url: "/api/favorites/events/ia-at-library", headers: { cookie } });
    expect(save.statusCode).toBe(404);
  });

  it("takes back a source's published rows when it is flipped to forbidden, and restores them when it is flipped back", async () => {
    expect((await whatsOn()).get("play")).toBe("teatrul-national-timisoara");

    await serve(THEATRE_OBJECTS);
    expect((await whatsOn()).has("play")).toBe(false);
    expect((await placesById()).has("tntm-venue")).toBe(false);
    expect((await get("/api/places/tntm-venue")).status).toBe(404);
    expect((await get("/api/events/play")).status).toBe(404);

    await serve(PENDING);
    expect((await whatsOn()).get("play")).toBe("teatrul-national-timisoara");
    expect((await placesById()).get("tntm-venue")?.credits).toEqual(["teatrul-national-timisoara"]);
    // Nothing was deleted on the way.
    expect(t.db.select().from(event).all()).toHaveLength(8);
  });

  it("sends no reminder for a held-back event", async () => {
    const save = await app.inject({ method: "POST", url: "/api/favorites/events/play", headers: { cookie } });
    expect(save.statusCode).toBe(204);
    expect(runReminderSweep(new Date(), t.db, THEATRE_OBJECTS)).toBe(0);
    expect(runReminderSweep(new Date(), t.db, PENDING)).toBe(1);
  });

  it("holds back nothing, and changes no reply but the credits, when no source is forbidden", async () => {
    await serve(withReuse({ iabilet: "permitted" }));
    expect((await placesById()).get("ia-venue")?.credits).toEqual(["iabilet"]);
    expect((await whatsOn()).get("ia-at-library")).toBe("iabilet");
    expect(((await get("/api/archive")).body.data as unknown[]).length).toBe(1);
    await serve(PENDING);
  });
});

describe("accepting a staged row from a forbidden source", () => {
  it("skips it with a reason, so it never becomes a live event", async () => {
    const t = await buildTestApp();
    t.db
      .insert(place)
      .values({
        id: "p",
        name: "Sala",
        category: "other",
        source: "osm",
        osmType: "node",
        osmId: "9",
        city: TM,
        lat: 45.75,
        lng: 21.22,
      })
      .run();
    t.db
      .insert(eventSource)
      .values({
        id: "ia",
        name: "iaBilet",
        adapterKey: "iabilet:tm",
        mechanism: "html",
        url: "https://www.iabilet.ro/x",
        city: TM,
      })
      .run();
    t.db
      .insert(stagedEvent)
      .values({
        id: "s",
        sourceId: "ia",
        placeId: "p",
        matchStatus: "auto-matched",
        status: "new",
        title: "Show",
        startDate: at(DAY),
      })
      .run();
    const admin = (await t.signIn("admin")).cookie;
    const res = await t.app.inject({
      method: "POST",
      url: "/api/admin/staged-events/accept",
      headers: { cookie: admin },
      payload: { ids: ["s"] },
    });
    expect(res.json()).toMatchObject({
      accepted: [],
      skipped: [{ id: "s", reason: "its source is forbidden by the source registry" }],
    });
    expect(t.db.select().from(event).all()).toEqual([]);
    await t.close();
  });
});
