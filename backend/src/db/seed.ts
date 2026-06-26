import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { randomUUID } from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { resources, events } from "./schema.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "../../data/app.db");

if (!fs.existsSync(dbPath)) {
  console.error("Database not found at", dbPath, "— run db:migrate first");
  process.exit(1);
}

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
const db = drizzle(sqlite);

// NYC Central Park area coordinates (lat ~40.785, lng ~-73.968)
const seedResources = [
  {
    id: randomUUID(),
    name: "Central Park Public Library",
    description:
      "A modern, accessible space offering a vast collection of physical and digital resources. Features include quiet reading zones, a children's interactive learning center, and public computer labs with high-speed internet access.",
    category: "library",
    address: "455 Fifth Ave, New York, NY 10016",
    lat: 40.7527,
    lng: -73.9772,
    website: "https://nypl.org",
    phone: "(212) 340-0849",
    openingHours: JSON.stringify({
      Mon: "9:00 AM – 8:00 PM",
      Tue: "9:00 AM – 8:00 PM",
      Wed: "9:00 AM – 8:00 PM",
      Thu: "9:00 AM – 8:00 PM",
      Fri: "9:00 AM – 6:00 PM",
      Sat: "10:00 AM – 5:00 PM",
      Sun: "Closed",
    }),
  },
  {
    id: randomUUID(),
    name: "Northside Community Center",
    description:
      "The Northside Community Center serves as a vital hub for residents, offering multi-purpose rooms, a full-size gymnasium, and dedicated spaces for youth and senior activities.",
    category: "community_center",
    address: "1234 Amsterdam Ave, New York, NY 10025",
    lat: 40.7965,
    lng: -73.9638,
    website: "https://northsidecommunity.nyc.gov",
    phone: "(212) 865-2820",
    openingHours: JSON.stringify({
      Mon: "8:00 AM – 8:00 PM",
      Tue: "8:00 AM – 8:00 PM",
      Wed: "8:00 AM – 8:00 PM",
      Thu: "8:00 AM – 8:00 PM",
      Fri: "8:00 AM – 6:00 PM",
      Sat: "9:00 AM – 5:00 PM",
      Sun: "Closed",
    }),
  },
  {
    id: randomUUID(),
    name: "Riverside Park",
    description:
      "A scenic riverside park stretching along the Hudson River, offering walking trails, playgrounds, sports courts, and stunning sunset views.",
    category: "park",
    address: "Riverside Park, New York, NY 10024",
    lat: 40.801,
    lng: -73.9724,
    website: "https://nycgovparks.org/parks/riverside-park",
    phone: "(212) 639-9675",
    openingHours: JSON.stringify({
      Mon: "6:00 AM – 10:00 PM",
      Tue: "6:00 AM – 10:00 PM",
      Wed: "6:00 AM – 10:00 PM",
      Thu: "6:00 AM – 10:00 PM",
      Fri: "6:00 AM – 10:00 PM",
      Sat: "6:00 AM – 10:00 PM",
      Sun: "6:00 AM – 10:00 PM",
    }),
  },
  {
    id: randomUUID(),
    name: "Upper West Side Health Clinic",
    description:
      "Free and low-cost primary care, mental health services, and wellness programs for uninsured and underinsured residents.",
    category: "healthcare",
    address: "160 W 86th St, New York, NY 10024",
    lat: 40.7868,
    lng: -73.9741,
    website: "https://uchealthnyc.org",
    phone: "(212) 749-1820",
    openingHours: JSON.stringify({
      Mon: "8:00 AM – 6:00 PM",
      Tue: "8:00 AM – 6:00 PM",
      Wed: "8:00 AM – 6:00 PM",
      Thu: "8:00 AM – 6:00 PM",
      Fri: "8:00 AM – 4:00 PM",
      Sat: "9:00 AM – 1:00 PM",
      Sun: "Closed",
    }),
  },
  {
    id: randomUUID(),
    name: "Harlem Food Bank Distribution",
    description:
      "Weekly food distribution serving local families. Bring a bag and photo ID. No income verification required.",
    category: "food",
    address: "145 W 125th St, New York, NY 10027",
    lat: 40.8087,
    lng: -73.9493,
    website: "https://cityharvestnyc.org",
    phone: "(917) 351-8700",
    openingHours: JSON.stringify({
      Thu: "10:00 AM – 2:00 PM",
      Sat: "9:00 AM – 12:00 PM",
    }),
  },
  {
    id: randomUUID(),
    name: "Columbia University Public Lectures",
    description:
      "Free public educational events, lectures, and workshops hosted at Columbia University. Open to all community members.",
    category: "education",
    address: "116th St & Broadway, New York, NY 10027",
    lat: 40.8075,
    lng: -73.9626,
    website: "https://columbia.edu/events",
    phone: "(212) 854-1754",
    openingHours: JSON.stringify({ "Event-based": "Varies" }),
  },
  {
    id: randomUUID(),
    name: "Midtown Homeless Shelter",
    description:
      "Emergency overnight shelter and day services including meals, showers, and case management. Walk-ins welcome.",
    category: "shelter",
    address: "257 W 30th St, New York, NY 10001",
    lat: 40.7495,
    lng: -73.9963,
    website: "https://nychmhc.org",
    phone: "(212) 947-4444",
    openingHours: JSON.stringify({ "24/7": "Open around the clock" }),
  },
  {
    id: randomUUID(),
    name: "Central Park Conservancy",
    description:
      "Iconic 843-acre urban park featuring the Great Lawn, Bethesda Fountain, Conservatory Garden, and year-round free programming.",
    category: "park",
    address: "Central Park, New York, NY 10024",
    lat: 40.7851,
    lng: -73.9683,
    website: "https://centralparknyc.org",
    phone: "(212) 310-6600",
    openingHours: JSON.stringify({
      "Daily": "6:00 AM – 1:00 AM",
    }),
  },
];

const now = new Date();
const nextWeek = (offsetDays: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
};

const seedEvents = [
  {
    id: randomUUID(),
    title: "Food Truck Friday at Centennial Park",
    description:
      "Enjoy a rotating lineup of 20+ food trucks with cuisine from around the world. Live DJ sets from 6–9 PM. Family-friendly, free admission.",
    category: "festival",
    address: "Centennial Park Plaza, New York, NY 10025",
    lat: 40.7852,
    lng: -73.9701,
    startDate: nextWeek(2),
    endDate: nextWeek(2).replace("T", "T21:00:00+00:00").split("+")[0] + "Z",
    sourceUrl: "https://eventbrite.com",
    sourcePlatform: "Eventbrite",
    imageUrl: null,
    price: 0,
    currency: "USD",
  },
  {
    id: randomUUID(),
    title: "Outdoor Cinema: Classic Features",
    description:
      "Catch classic films under the stars at the Riverfront Amphitheater. Bring blankets and chairs. Concessions available on-site.",
    category: "other",
    address: "Riverfront Amphitheater, New York, NY 10004",
    lat: 40.7007,
    lng: -74.0151,
    startDate: nextWeek(3),
    endDate: null,
    sourceUrl: "https://eventbrite.com",
    sourcePlatform: "Eventbrite",
    imageUrl: null,
    price: 0,
    currency: "USD",
  },
  {
    id: randomUUID(),
    title: "Downtown Weekend Farmers Market",
    description:
      "Fresh local produce, artisanal foods, crafts, and live music. Every Saturday and Sunday at Market Square. Over 80 vendors.",
    category: "community",
    address: "Market Square, New York, NY 10013",
    lat: 40.7197,
    lng: -74.0036,
    startDate: nextWeek(4),
    endDate: null,
    sourceUrl: "https://greenmarketnyc.org",
    sourcePlatform: "GrowNYC",
    imageUrl: null,
    price: 0,
    currency: "USD",
  },
  {
    id: randomUUID(),
    title: "City Jazz Festival — Main Stage",
    description:
      "Experience an unforgettable evening of rhythm and soul. Featuring internationally acclaimed artists and local legends. Food trucks and vendors on-site. Bring a blanket or chair for lawn seating.",
    category: "concert",
    address: "Central Park SummerStage, New York, NY 10024",
    lat: 40.7744,
    lng: -73.9717,
    startDate: nextWeek(5),
    endDate: null,
    sourceUrl: "https://cityparksfoundation.org",
    sourcePlatform: "SummerStage",
    imageUrl: null,
    price: 25,
    currency: "USD",
  },
  {
    id: randomUUID(),
    title: "Community Theater: A Midsummer Night's Dream",
    description:
      "The Manhattan Community Theater presents Shakespeare's beloved comedy, reimagined in modern dress. Suitable for all ages.",
    category: "theater",
    address: "Delacorte Theater, Central Park, NY 10024",
    lat: 40.7821,
    lng: -73.9675,
    startDate: nextWeek(6),
    endDate: null,
    sourceUrl: "https://shakespeareinthepark.org",
    sourcePlatform: "Public Theater",
    imageUrl: null,
    price: 0,
    currency: "USD",
  },
  {
    id: randomUUID(),
    title: "Urban Sketching Workshop",
    description:
      "Join local artist Maria Reyes for a hands-on urban sketching session in Central Park. Materials provided. All skill levels welcome. Limited to 20 participants.",
    category: "workshop",
    address: "Bethesda Terrace, Central Park, NY 10024",
    lat: 40.7739,
    lng: -73.9706,
    startDate: nextWeek(7),
    endDate: null,
    sourceUrl: "https://eventbrite.com",
    sourcePlatform: "Eventbrite",
    imageUrl: null,
    price: 15,
    currency: "USD",
  },
  {
    id: randomUUID(),
    title: "5K Run for Community Health",
    description:
      "Annual charity run through Riverside Park. All proceeds benefit the Upper West Side Health Clinic. Register online — 800 spots available.",
    category: "sport",
    address: "Riverside Park, New York, NY 10024",
    lat: 40.801,
    lng: -73.9724,
    startDate: nextWeek(9),
    endDate: null,
    sourceUrl: "https://runsignup.com",
    sourcePlatform: "RunSignUp",
    imageUrl: null,
    price: 30,
    currency: "USD",
  },
  {
    id: randomUUID(),
    title: "Harlem Cultural Exhibition",
    description:
      "A celebration of Harlem's rich artistic and cultural heritage. Featuring local visual artists, live spoken word, and a curated photography retrospective.",
    category: "exhibition",
    address: "Schomburg Center, 515 Malcolm X Blvd, NY 10037",
    lat: 40.8138,
    lng: -73.9397,
    startDate: nextWeek(1),
    endDate: nextWeek(14),
    sourceUrl: "https://nypl.org/locations/schomburg",
    sourcePlatform: "NYPL",
    imageUrl: null,
    price: 0,
    currency: "USD",
  },
];

async function seed() {
  console.log("Seeding resources...");
  for (const r of seedResources) {
    await db.insert(resources).values(r).onConflictDoNothing();
  }
  console.log(`  ✓ ${seedResources.length} resources inserted`);

  console.log("Seeding events...");
  for (const e of seedEvents) {
    await db.insert(events).values(e).onConflictDoNothing();
  }
  console.log(`  ✓ ${seedEvents.length} events inserted`);

  console.log("Seed complete.");
  sqlite.close();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  sqlite.close();
  process.exit(1);
});
