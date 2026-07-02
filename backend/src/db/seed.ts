import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { randomUUID } from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { place, event } from "./schema.js";
import * as schema from "./schema.js";
import { ensureAdmin } from "../lib/ensure-admin.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "../../data/app.db");

if (!fs.existsSync(dbPath)) {
  console.error("Database not found at", dbPath, "— run db:migrate first");
  process.exit(1);
}

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
const db = drizzle(sqlite, { schema });

// Placeholder NYC data — replaced by the Romania (Timișoara/București) seed in
// brief 08. Kept only so `db:seed` produces a coherent place-centric dataset.
const SEED_CITY = "New York";

const seedPlaces = [
  {
    id: randomUUID(),
    name: "Central Park Public Library",
    description:
      "A modern, accessible space offering a vast collection of physical and digital resources.",
    category: "library",
    source: "osm" as const,
    city: SEED_CITY,
    address: "455 Fifth Ave, New York, NY 10016",
    lat: 40.7527,
    lng: -73.9772,
    website: "https://nypl.org",
    phone: "(212) 340-0849",
    openingHours: JSON.stringify({ Mon: "9:00 AM – 8:00 PM", Sun: "Closed" }),
  },
  {
    id: randomUUID(),
    name: "Northside Community Center",
    description:
      "A vital hub for residents: multi-purpose rooms, a gymnasium, and youth/senior spaces.",
    category: "community_center",
    source: "osm" as const,
    city: SEED_CITY,
    address: "1234 Amsterdam Ave, New York, NY 10025",
    lat: 40.7965,
    lng: -73.9638,
    website: "https://northsidecommunity.nyc.gov",
    phone: "(212) 865-2820",
    openingHours: JSON.stringify({ Mon: "8:00 AM – 8:00 PM", Sun: "Closed" }),
  },
  {
    id: randomUUID(),
    name: "Riverside Park",
    description:
      "A scenic riverside park along the Hudson with trails, playgrounds, and sports courts.",
    category: "park",
    source: "osm" as const,
    city: SEED_CITY,
    address: "Riverside Park, New York, NY 10024",
    lat: 40.801,
    lng: -73.9724,
    website: "https://nycgovparks.org/parks/riverside-park",
    phone: "(212) 639-9675",
    openingHours: JSON.stringify({ Daily: "6:00 AM – 10:00 PM" }),
  },
  {
    id: randomUUID(),
    name: "Upper West Side Health Clinic",
    description:
      "Free and low-cost primary care, mental health services, and wellness programs.",
    category: "clinic",
    source: "osm" as const,
    city: SEED_CITY,
    address: "160 W 86th St, New York, NY 10024",
    lat: 40.7868,
    lng: -73.9741,
    website: "https://uchealthnyc.org",
    phone: "(212) 749-1820",
    openingHours: JSON.stringify({ Mon: "8:00 AM – 6:00 PM", Sun: "Closed" }),
  },
  {
    id: randomUUID(),
    name: "Delacorte Theater",
    description:
      "Open-air theater in Central Park, home to free summer Shakespeare productions.",
    category: "theater",
    source: "event-venue" as const,
    city: SEED_CITY,
    address: "Delacorte Theater, Central Park, NY 10024",
    lat: 40.7821,
    lng: -73.9675,
    website: "https://shakespeareinthepark.org",
    phone: null,
    openingHours: JSON.stringify({ "Event-based": "Varies" }),
  },
];

const now = new Date();
const inDays = (offsetDays: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
};

const seedEvents = [
  {
    id: randomUUID(),
    placeId: seedPlaces[2]!.id, // Riverside Park
    title: "Food Truck Friday",
    description: "A rotating lineup of 20+ food trucks with live DJ sets. Free admission.",
    category: "festival",
    status: "live" as const,
    startDate: inDays(2),
    endDate: null,
    buyUrl: null,
    sourceUrl: "https://example.org/food-truck-friday",
    sourcePlatform: "Community Calendar",
    imageUrl: null,
    price: 0,
    currency: "USD",
  },
  {
    id: randomUUID(),
    placeId: seedPlaces[4]!.id, // Delacorte Theater
    title: "Community Theater: A Midsummer Night's Dream",
    description: "Shakespeare's beloved comedy, reimagined in modern dress. All ages.",
    category: "theater",
    status: "live" as const,
    startDate: inDays(6),
    endDate: null,
    buyUrl: null,
    sourceUrl: "https://shakespeareinthepark.org",
    sourcePlatform: "Public Theater",
    imageUrl: null,
    price: 0,
    currency: "USD",
  },
  {
    id: randomUUID(),
    placeId: seedPlaces[0]!.id, // Central Park Public Library
    title: "Urban Sketching Workshop",
    description: "Hands-on urban sketching session. Materials provided. All skill levels.",
    category: "workshop",
    status: "live" as const,
    startDate: inDays(7),
    endDate: null,
    buyUrl: "https://example.org/tickets/urban-sketching",
    sourceUrl: "https://example.org/urban-sketching",
    sourcePlatform: "Community Calendar",
    imageUrl: null,
    price: 15,
    currency: "USD",
  },
];

async function seed() {
  console.log("Seeding places...");
  for (const p of seedPlaces) {
    await db.insert(place).values(p).onConflictDoNothing();
  }
  console.log(`  ✓ ${seedPlaces.length} places inserted`);

  console.log("Seeding events...");
  for (const e of seedEvents) {
    await db.insert(event).values(e).onConflictDoNothing();
  }
  console.log(`  ✓ ${seedEvents.length} events inserted`);

  await ensureAdmin(db);

  console.log("Seed complete.");
  sqlite.close();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  sqlite.close();
  process.exit(1);
});
