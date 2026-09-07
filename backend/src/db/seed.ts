import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { randomUUID } from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { place, event } from "./schema.js";
import * as schema from "./schema.js";
import { zonedParts, zonedTimeToInstant } from "../lib/time.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath =
  process.env.DATABASE_PATH ?? path.resolve(__dirname, "../../data/app.db");

if (!fs.existsSync(dbPath)) {
  console.error("Database not found at", dbPath, "— run db:migrate first");
  process.exit(1);
}

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
const db = drizzle(sqlite, { schema });

const TM = "Timișoara";
const BU = "București";

/**
 * PLACES ARE REAL. These are genuine public institutions with approximate
 * real coordinates, standing in until an OSM sync populates the table properly
 * (`POST /api/admin/osm/sync`).
 *
 * EVENTS ARE SYNTHETIC. No ingestion adapter exists yet (brief 04), so every
 * event below is invented to exercise the UI. Nothing here came from a
 * publisher, and none of it should ever be shown to a real user as fact.
 */
type SeedPlace = {
  id: string;
  name: string;
  description?: string;
  category: string;
  source: "osm";
  city: string;
  address: string;
  lat: number;
  lng: number;
  website?: string;
  phone?: string;
  openingHours?: string;
};

function p(
  name: string,
  category: string,
  city: string,
  address: string,
  lat: number,
  lng: number,
  extra: Partial<SeedPlace> = {},
): SeedPlace {
  return { id: randomUUID(), name, category, source: "osm", city, address, lat, lng, ...extra };
}

const seedPlaces: SeedPlace[] = [
  // --- Timișoara ---------------------------------------------------------
  p("Parcul Central", "park", TM, "Bd. Mihai Viteazu, Timișoara", 45.7506, 21.2246, {
    description: "Parc urban între Piața Victoriei și malul Begăi.",
    openingHours: "Non-stop",
  }),
  p("Parcul Rozelor", "park", TM, "Splaiul Tudor Vladimirescu, Timișoara", 45.7466, 21.2296, {
    description: "Grădina de trandafiri de pe malul Begăi.",
    openingHours: "Non-stop",
  }),
  p("Parcul Botanic", "park", TM, "Str. Mihai Viteazu 24, Timișoara", 45.7568, 21.2199, {
    openingHours: "Zilnic 08:00–20:00",
  }),
  p("Pădurea Verde", "park", TM, "Calea Dorobanților, Timișoara", 45.7727, 21.2643),
  p("Parcul Justiției", "park", TM, "Str. Ștefan cel Mare, Timișoara", 45.7448, 21.2258),
  p("Muzeul de Artă Timișoara", "museum", TM, "Piața Unirii 1, Timișoara", 45.7570, 21.2287, {
    description: "Colecția de artă a Banatului, în Palatul Baroc.",
    website: "https://muzeuldeartatm.ro",
    openingHours: "Ma–Du 10:00–18:00 · Luni închis",
  }),
  p("Muzeul Satului Bănățean", "museum", TM, "Aleea Avram Imbroane 31, Timișoara", 45.7729, 21.2606, {
    openingHours: "Ma–Du 10:00–18:00",
  }),
  p("Muzeul Național al Banatului", "museum", TM, "Piața Huniade 1, Timișoara", 45.7538, 21.2280, {
    description: "Castelul Huniade — istoria Banatului.",
    openingHours: "Ma–Du 10:00–18:00 · Luni închis",
  }),
  p("Biblioteca Centrală Universitară „Eugen Todoran”", "library", TM, "Bd. Vasile Pârvan 4A, Timișoara", 45.7472, 21.2306, {
    openingHours: "Lu–Vi 08:00–20:00 · Sâ 09:00–14:00",
  }),
  p("Biblioteca Județeană Timiș „Sorin Titel”", "library", TM, "Piața Libertății 3, Timișoara", 45.7546, 21.2242, {
    openingHours: "Lu–Vi 09:00–19:00",
  }),
  p("Primăria Municipiului Timișoara", "townhall", TM, "Bd. C.D. Loga 1, Timișoara", 45.7566, 21.2262, {
    website: "https://primariatm.ro",
    openingHours: "Lu–Vi 08:30–16:30",
  }),
  p("Consiliul Județean Timiș", "townhall", TM, "Bd. Revoluției din 1989 nr. 17, Timișoara", 45.7513, 21.2246, {
    openingHours: "Lu–Vi 08:00–16:00",
  }),
  p("Teatrul Național „Mihai Eminescu”", "theater", TM, "Str. Mărășești 2, Timișoara", 45.7539, 21.2255, {
    website: "https://tntimisoara.com",
  }),
  p("Filarmonica Banatul", "theater", TM, "Bd. C.D. Loga 2, Timișoara", 45.7526, 21.2237),
  p("Casa de Cultură a Municipiului Timișoara", "cultural_center", TM, "Str. Miron Costin 2, Timișoara", 45.7583, 21.2232),
  p("Casa Tineretului", "cultural_center", TM, "Str. Arieș 19, Timișoara", 45.7382, 21.2306),
  p("Universitatea de Vest din Timișoara", "education", TM, "Bd. Vasile Pârvan 4, Timișoara", 45.7472, 21.2312, {
    website: "https://uvt.ro",
  }),
  p("Universitatea Politehnica Timișoara", "education", TM, "Piața Victoriei 2, Timișoara", 45.7469, 21.2264),
  p("Spitalul Clinic Județean de Urgență", "clinic", TM, "Bd. Liviu Rebreanu 156, Timișoara", 45.7607, 21.2372, {
    openingHours: "Non-stop",
  }),
  p("Spitalul Clinic Municipal de Urgență", "clinic", TM, "Str. Gheorghe Dima 5, Timișoara", 45.7521, 21.2144, {
    openingHours: "Non-stop",
  }),
  p("Sala Polivalentă „Constantin Jude”", "sports", TM, "Str. Ana Ipătescu 1, Timișoara", 45.7469, 21.2226),
  p("Stadionul Dan Păltinișanu", "sports", TM, "Aleea F.C. Ripensia 11, Timișoara", 45.7419, 21.2381),
  p("Centrul Comunitar Fratelia", "community_center", TM, "Str. Izlaz, Timișoara", 45.7276, 21.2130),

  // --- București ---------------------------------------------------------
  p("Parcul Regele Mihai I (Herăstrău)", "park", BU, "Șos. Kiseleff, București", 44.4713, 26.0830, {
    openingHours: "Non-stop",
  }),
  p("Parcul Cișmigiu", "park", BU, "Bd. Regina Elisabeta, București", 44.4363, 26.0908, {
    openingHours: "Non-stop",
  }),
  p("Parcul Carol I", "park", BU, "Str. Candiano Popescu, București", 44.4152, 26.0967),
  p("Parcul Tineretului", "park", BU, "Bd. Tineretului, București", 44.4046, 26.1046),
  p("Muzeul Național de Artă al României", "museum", BU, "Calea Victoriei 49–53, București", 44.4392, 26.0958, {
    website: "https://mnar.arts.ro",
    openingHours: "Mi–Du 10:00–18:00",
  }),
  p("Muzeul Național al Satului „Dimitrie Gusti”", "museum", BU, "Șos. Kiseleff 28, București", 44.4690, 26.0776, {
    openingHours: "Ma–Du 09:00–19:00",
  }),
  p("Muzeul Național de Istorie a României", "museum", BU, "Calea Victoriei 12, București", 44.4318, 26.0983),
  p("Biblioteca Națională a României", "library", BU, "Bd. Unirii 22, București", 44.4270, 26.1085, {
    openingHours: "Lu–Vi 08:30–20:00",
  }),
  p("Biblioteca Centrală Universitară „Carol I”", "library", BU, "Str. Boteanu 1, București", 44.4380, 26.0966),
  p("Primăria Municipiului București", "townhall", BU, "Bd. Regina Elisabeta 47, București", 44.4340, 26.0937, {
    website: "https://pmb.ro",
    openingHours: "Lu–Vi 08:30–16:30",
  }),
  p("Teatrul Național „I.L. Caragiale”", "theater", BU, "Bd. Nicolae Bălcescu 2, București", 44.4359, 26.1046),
  p("Ateneul Român", "cultural_center", BU, "Str. Benjamin Franklin 1–3, București", 44.4413, 26.0973),
  p("Universitatea din București", "education", BU, "Bd. Mihail Kogălniceanu 36–46, București", 44.4356, 26.1006),
  p("Spitalul Universitar de Urgență București", "clinic", BU, "Splaiul Independenței 169, București", 44.4166, 26.0913, {
    openingHours: "Non-stop",
  }),
  p("Arena Națională", "sports", BU, "Bd. Basarabia 37–39, București", 44.4374, 26.1526),
];

const byName = (name: string) => seedPlaces.find((x) => x.name === name)!.id;

/** A Bucharest wall-clock time N days from today, as the UTC instant we store. */
function at(dayOffset: number, hour: number, minute = 0): string {
  const now = zonedParts(new Date());
  return zonedTimeToInstant(now.year, now.month, now.day + dayOffset, hour, minute).toISOString();
}

/** Days until the coming Saturday (0 if today is Saturday). */
function untilSaturday(): number {
  const wd = zonedParts(new Date()).weekday;
  return (6 - wd + 7) % 7;
}

const SAT = untilSaturday();
const SUN = SAT + 1;

/**
 * SYNTHETIC. Deliberately sparse and lumpy — most places have nothing on, which
 * is what the real data will look like. If every pin had events the UI would be
 * tested against a fiction.
 */
const seedEvents = [
  {
    placeId: byName("Muzeul de Artă Timișoara"),
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
    placeId: byName("Muzeul de Artă Timișoara"),
    title: "Tur ghidat: Colecția Banat",
    category: "workshop",
    startDate: at(SUN, 11, 0),
    buyUrl: null,
    sourcePlatform: "Muzeul de Artă Timișoara",
    price: 0,
    currency: "RON",
  },
  {
    placeId: byName("Muzeul de Artă Timișoara"),
    title: "Noaptea Muzeelor Deschise",
    category: "festival",
    startDate: at(17, 18, 30),
    buyUrl: null,
    sourcePlatform: "Centrul de Proiecte Timișoara",
  },
  {
    placeId: byName("Teatrul Național „Mihai Eminescu”"),
    title: "O scrisoare pierdută",
    category: "theater",
    startDate: at(SAT, 19, 0),
    buyUrl: "https://tntimisoara.com/bilete",
    sourcePlatform: "Teatrul Național Timișoara",
    price: 45,
    currency: "RON",
  },
  {
    placeId: byName("Teatrul Național „Mihai Eminescu”"),
    title: "Livada de vișini",
    category: "theater",
    startDate: at(SAT + 7, 19, 0),
    buyUrl: "https://tntimisoara.com/bilete",
    sourcePlatform: "Teatrul Național Timișoara",
    price: 45,
    currency: "RON",
  },
  {
    placeId: byName("Casa de Cultură a Municipiului Timișoara"),
    title: "Atelier de fotografie urbană",
    category: "workshop",
    startDate: at(SAT, 10, 30),
    buyUrl: null,
    sourcePlatform: "Casa de Cultură Timișoara",
    price: 0,
    currency: "RON",
  },
  {
    placeId: byName("Casa de Cultură a Municipiului Timișoara"),
    title: "Seară de muzică veche bănățeană",
    category: "concert",
    startDate: at(SUN, 18, 0),
    buyUrl: null,
    sourcePlatform: "Casa de Cultură Timișoara",
  },
  {
    placeId: byName("Biblioteca Județeană Timiș „Sorin Titel”"),
    title: "Lansare de carte: Banatul în hărți",
    category: "community",
    startDate: at(3, 17, 0),
    buyUrl: null,
    sourcePlatform: "Biblioteca Județeană Timiș",
  },
  {
    placeId: byName("Parcul Rozelor"),
    title: "Concert în aer liber — Fanfara Banatului",
    category: "concert",
    startDate: at(SUN, 17, 0),
    buyUrl: null,
    sourcePlatform: "Primăria Timișoara",
  },
  {
    placeId: byName("Primăria Municipiului Timișoara"),
    title: "Dezbatere publică: bugetul local",
    category: "community",
    startDate: at(5, 16, 0),
    buyUrl: null,
    sourceUrl: "https://primariatm.ro/anunturi",
    sourcePlatform: "Primăria Timișoara",
  },
  {
    placeId: byName("Muzeul Național de Artă al României"),
    title: "Grigorescu — lucrări din depozit",
    category: "exhibition",
    startDate: at(0, 18, 0),
    buyUrl: "https://mnar.arts.ro/bilete",
    sourcePlatform: "MNAR",
    price: 35,
    currency: "RON",
  },
  {
    placeId: byName("Ateneul Român"),
    title: "Filarmonica George Enescu — Brahms",
    category: "concert",
    startDate: at(SAT, 19, 0),
    buyUrl: "https://fge.org.ro/bilete",
    sourcePlatform: "Filarmonica George Enescu",
    price: 80,
    currency: "RON",
  },
  {
    placeId: byName("Muzeul Național al Satului „Dimitrie Gusti”"),
    title: "Târgul meșterilor populari",
    category: "festival",
    startDate: at(SUN, 10, 0),
    buyUrl: null,
    sourcePlatform: "Muzeul Satului",
  },
  {
    placeId: byName("Parcul Cișmigiu"),
    title: "Alergare comunitară de dimineață",
    category: "sport",
    startDate: at(SAT, 8, 30),
    buyUrl: null,
    sourcePlatform: "Primăria Municipiului București",
  },
];

async function seed() {
  console.log("Seeding places (Timișoara + București)...");
  for (const row of seedPlaces) {
    await db.insert(place).values(row).onConflictDoNothing();
  }
  console.log(`  ✓ ${seedPlaces.length} places inserted`);

  console.log("Seeding events (synthetic — no ingestion adapter exists yet)...");
  for (const e of seedEvents) {
    await db
      .insert(event)
      .values({
        id: randomUUID(),
        status: "live" as const,
        endDate: null,
        imageUrl: null,
        description: null,
        sourceUrl: null,
        price: null,
        currency: null,
        ...e,
      })
      .onConflictDoNothing();
  }
  console.log(`  ✓ ${seedEvents.length} events inserted`);

  /*
   * No admin is seeded. prm holds no accounts and no roles — `prm:admin` is a
   * Ward grant, issued by hand from Ward's console. Seeding one here would
   * mean a redeploy could silently re-grant admin, which is exactly what
   * moving authority to Ward was for.
   */
  console.log("Seed complete.");
  sqlite.close();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  sqlite.close();
  process.exit(1);
});
