import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { createDb } from "./index.js";
import { fixture, seedDatabase } from "./seed-data.js";

/**
 * `npm run db:seed -w backend`: reset the dev database to the Timișoara +
 * București seed (seed-data.ts). Set SEED_DEMO_SUBJECT to a Ward subject to
 * give that person favourites and a notification.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath =
  process.env.DATABASE_PATH ?? path.resolve(__dirname, "../../data/app.db");

// Seeding resets every place, event, favourite and notification. It is for
// dev and e2e databases, never a live one.
if (process.env.NODE_ENV === "production") {
  console.error("Refusing to seed with NODE_ENV=production: seeding wipes places and events.");
  process.exit(1);
}
if (!fs.existsSync(dbPath)) {
  console.error("Database not found at", dbPath, "— run db:migrate first");
  process.exit(1);
}

const { db, sqlite } = createDb(dbPath);
console.log("Seeding Timișoara + București (resets places, events, favourites, notifications)...");
try {
  const demoSubject = process.env.SEED_DEMO_SUBJECT;
  const r = seedDatabase(db, { demoSubject });
  console.log(`  ✓ ${r.places} places (OSM fixture captured ${fixture.capturedAt}, plus event venues)`);
  console.log(`  ✓ ${r.events} synthetic events`);
  if (r.demo) console.log(`  ✓ demo subject ${demoSubject}: 2 followed places, 1 saved event, 1 notification`);
  console.log("Seed complete.");
} catch (err) {
  console.error("Seed failed:", err);
  process.exitCode = 1;
} finally {
  sqlite.close();
}
