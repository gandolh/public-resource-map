import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import {
  event,
  favoriteEvent,
  favoritePlace,
  notification,
  notificationEvent,
  place,
  stagedEvent,
} from "./schema.js";
import type { DB } from "./index.js";
import { zonedParts, zonedTimeToInstant } from "../lib/time.js";
import { notifyNewEvents } from "../lib/notify.js";
import type { OsmPlaceInput } from "../lib/osm-sync.js";
import { SEED, osmKey, seedId } from "./seed-ids.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TM = "Timișoara";
const BU = "București";

/**
 * PLACES ARE REAL. `fixtures/osm-places.json` is a frozen OSM sync of both
 * cities: the same Overpass query and normalisation as the admin "Sync from
 * OSM" button, captured once so seeding is offline and repeatable. Refresh it
 * with `npm run db:capture-osm -w backend` (see capture-osm.ts).
 *
 * EVENTS ARE SYNTHETIC. They are invented to exercise the UI, dated from
 * today, and attached to real places. Nothing here came from a publisher, and
 * none of it should ever be shown to a real user as fact. Real events come
 * through ingestion (brief 04) from sources the owner has vetted.
 */
export const fixture = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "fixtures/osm-places.json"), "utf8"),
) as { capturedAt: string; places: OsmPlaceInput[] };

const osmPlaces = fixture.places.map((p) => ({
  ...p,
  id: seedId(osmKey(p.osmType, p.osmId)),
  source: "osm" as const,
}));

/**
 * Event venues: real places events happen at that OSM's place set does not
 * hold, the way ingestion creates one when an event names a venue the map has
 * never seen (source `event-venue`). A square is the usual case.
 */
const venues = [
  {
    id: SEED.places.tmPiataVictoriei,
    name: "Piața Victoriei",
    category: "other",
    source: "event-venue" as const,
    city: TM,
    address: "Piața Victoriei, Timișoara",
    lat: 45.7536,
    lng: 21.2257,
  },
];

/** A seeded OSM place by its element, failing loudly if a refresh dropped it. */
function osm(element: string): string {
  const [osmType, osmId] = element.split("/");
  const id = seedId(osmKey(osmType, osmId));
  if (!osmPlaces.some((p) => p.id === id)) {
    throw new Error(`OSM ${element} is not in the fixture; re-point its seed events`);
  }
  return id;
}

const PLACE = {
  tmArtMuseum: osm("node/2634652196"), // Muzeul de Artă
  tmTheatre: osm("way/194401985"), // Teatrul Național Timișoara
  tmStudentCulture: osm("way/463593723"), // Casa de Cultură a Studenților
  tmCountyLibrary: osm("way/24564874"), // Biblioteca Județeană Timiș
  tmRozelor: osm("relation/1250434"), // Parcul Rozelor
  tmCityHall: osm("way/194845432"), // Primăria Municipiului Timișoara
  buArtMuseum: osm("node/2634652837"), // Muzeul Național de Artă al României
  buAteneu: osm("way/16291602"), // Ateneul Român
  buVillageMuseum: osm("way/29701978"), // Muzeul Național al Satului Dimitrie Gusti
  buCismigiu: osm("way/16291869"), // Parcul Cișmigiu
};

/**
 * SYNTHETIC events, dated from `now`. Deliberately sparse and lumpy — most
 * places have nothing on, which is what the real data will look like. If every
 * pin had events the UI would be tested against a fiction.
 */
function seedEvents(now: Date) {
  const today = zonedParts(now);
  /** A Bucharest wall-clock time N days from today, as the UTC instant we store. */
  const at = (dayOffset: number, hour: number, minute = 0) =>
    zonedTimeToInstant(today.year, today.month, today.day + dayOffset, hour, minute).toISOString();
  /** Days until the coming Saturday (0 if today is Saturday). */
  const SAT = (6 - today.weekday + 7) % 7;
  const SUN = SAT + 1;

  return [
    {
      placeId: PLACE.tmArtMuseum,
      title: "Corneliu Baba — Portretul târziu",
      description: "Expoziție temporară din colecția de artă modernă a muzeului.",
      category: "exhibition",
      startDate: at(0, 19, 0),
      buyUrl: "https://muzeuldeartatm.ro/bilete",
      sourceUrl: "https://muzeuldeartatm.ro/expozitii",
      sourcePlatform: "Muzeul de Artă Timișoara",
      price: 20,
      currency: "RON",
    },
    {
      placeId: PLACE.tmArtMuseum,
      title: "Tur ghidat: Colecția Banat",
      category: "workshop",
      startDate: at(SUN, 11, 0),
      buyUrl: null,
      sourcePlatform: "Muzeul de Artă Timișoara",
      price: 0,
      currency: "RON",
    },
    {
      placeId: PLACE.tmArtMuseum,
      title: "Noaptea Muzeelor Deschise",
      category: "festival",
      startDate: at(17, 18, 30),
      buyUrl: null,
      sourcePlatform: "Centrul de Proiecte Timișoara",
    },
    {
      placeId: PLACE.tmTheatre,
      title: "O scrisoare pierdută",
      category: "theater",
      startDate: at(SAT, 19, 0),
      buyUrl: "https://tntimisoara.com/bilete",
      sourcePlatform: "Teatrul Național Timișoara",
      price: 45,
      currency: "RON",
    },
    {
      placeId: PLACE.tmTheatre,
      title: "Livada de vișini",
      category: "theater",
      startDate: at(SAT + 7, 19, 0),
      buyUrl: "https://tntimisoara.com/bilete",
      sourcePlatform: "Teatrul Național Timișoara",
      price: 45,
      currency: "RON",
    },
    {
      placeId: PLACE.tmStudentCulture,
      title: "Atelier de fotografie urbană",
      category: "workshop",
      startDate: at(SAT, 10, 30),
      buyUrl: null,
      sourcePlatform: "Casa de Cultură a Studenților",
      price: 0,
      currency: "RON",
    },
    {
      placeId: SEED.places.tmPiataVictoriei,
      title: "Seară de muzică veche bănățeană",
      category: "concert",
      startDate: at(SUN, 18, 0),
      buyUrl: null,
      sourcePlatform: "Primăria Timișoara",
    },
    {
      placeId: PLACE.tmCountyLibrary,
      title: "Lansare de carte: Banatul în hărți",
      category: "community",
      startDate: at(3, 17, 0),
      buyUrl: null,
      sourcePlatform: "Biblioteca Județeană Timiș",
    },
    {
      placeId: PLACE.tmRozelor,
      title: "Concert în aer liber — Fanfara Banatului",
      category: "concert",
      startDate: at(SUN, 17, 0),
      buyUrl: null,
      sourcePlatform: "Primăria Timișoara",
    },
    {
      placeId: PLACE.tmCityHall,
      title: "Dezbatere publică: bugetul local",
      category: "community",
      startDate: at(5, 16, 0),
      buyUrl: null,
      sourceUrl: "https://primariatm.ro/anunturi",
      sourcePlatform: "Primăria Timișoara",
    },
    {
      placeId: PLACE.buArtMuseum,
      title: "Grigorescu — lucrări din depozit",
      category: "exhibition",
      startDate: at(0, 18, 0),
      buyUrl: "https://mnar.arts.ro/bilete",
      sourcePlatform: "MNAR",
      price: 35,
      currency: "RON",
    },
    {
      placeId: PLACE.buAteneu,
      title: "Filarmonica George Enescu — Brahms",
      category: "concert",
      startDate: at(SAT, 19, 0),
      buyUrl: "https://fge.org.ro/bilete",
      sourcePlatform: "Filarmonica George Enescu",
      price: 80,
      currency: "RON",
    },
    {
      placeId: PLACE.buVillageMuseum,
      title: "Târgul meșterilor populari",
      category: "festival",
      startDate: at(SUN, 10, 0),
      buyUrl: null,
      sourcePlatform: "Muzeul Satului",
    },
    {
      placeId: PLACE.buCismigiu,
      title: "Alergare comunitară de dimineață",
      category: "sport",
      startDate: at(SAT, 8, 30),
      buyUrl: null,
      sourcePlatform: "Primăria Municipiului București",
    },
    // A run, not a moment: opened two weeks ago, closes in about forty days.
    // Every other seed event is a point event (null end), which is how the
    // "vanishes the minute it starts" bug hid until brief 19.
    {
      placeId: PLACE.buArtMuseum,
      title: "Brâncuși și contemporanii săi — expoziție temporară",
      category: "exhibition",
      startDate: at(-14, 10, 0),
      endDate: at(40, 18, 0),
      buyUrl: "https://mnar.arts.ro/bilete",
      sourcePlatform: "MNAR",
      price: 40,
      currency: "RON",
    },
  ];
}

/** Rows per insert: SQLite caps bound parameters per statement. */
const CHUNK = 500;

/**
 * Reset, then load: every run ends in the same state with the same ids. The
 * reset clears what seeding writes and what hangs off it (favourites,
 * notifications, staged rows matched to places); event sources and the
 * geocode cache are configuration and are left alone.
 */
export interface SeedOptions {
  /** Events are dated from this instant. */
  now?: Date;
  /** A Ward subject to seed as the demo user (see below). */
  demoSubject?: string;
}

export interface SeedResult {
  places: number;
  events: number;
  demo: boolean;
}

export function seedDatabase(db: DB, { now = new Date(), demoSubject }: SeedOptions = {}): SeedResult {
  const events = seedEvents(now).map((e) => ({
    id: seedId(`event:${e.title}`), // titles are unique in this list
    status: "live" as const,
    endDate: null,
    imageUrl: null,
    description: null,
    sourceUrl: null,
    price: null,
    currency: null,
    ...e,
  }));

  db.transaction((tx) => {
    tx.delete(notificationEvent).run();
    tx.delete(notification).run();
    tx.delete(favoriteEvent).run();
    tx.delete(favoritePlace).run();
    tx.delete(stagedEvent).run();
    tx.delete(event).run();
    tx.delete(place).run();

    const places = [...osmPlaces, ...venues];
    for (let i = 0; i < places.length; i += CHUNK) {
      tx.insert(place).values(places.slice(i, i + CHUNK)).run();
    }
    tx.insert(event).values(events).run();
  });

  /*
   * A demo account, when asked for. prm keeps no accounts — a person is a Ward
   * subject — so the demo user is whichever subject you name: sign in through
   * Ward once, read your subject from `GET /api/me`, and seed with
   * SEED_DEMO_SUBJECT=<it> (`demoSubject`). They follow two places and save one event, and
   * the bell holds one new-events item, so the retention loop shows from a
   * fresh seed.
   */
  const demo = demoSubject?.trim();
  if (demo) {
    db.insert(favoritePlace)
      .values([
        { subject: demo, placeId: PLACE.tmArtMuseum },
        { subject: demo, placeId: PLACE.buArtMuseum },
      ])
      .run();
    const saved = events.find((e) => e.placeId === PLACE.tmTheatre)!;
    db.insert(favoriteEvent).values({ subject: demo, eventId: saved.id }).run();
    notifyNewEvents(
      db,
      events.filter((e) => e.placeId === PLACE.tmArtMuseum).map((e) => ({ eventId: e.id, placeId: e.placeId })),
      now,
    );
  }

  /*
   * No admin is seeded. prm holds no accounts and no roles — `prm:admin` is a
   * Ward grant, issued by hand from Ward's console. Seeding one here would
   * mean a redeploy could silently re-grant admin, which is exactly what
   * moving authority to Ward was for.
   */
  return { places: osmPlaces.length + venues.length, events: events.length, demo: Boolean(demo) };
}
