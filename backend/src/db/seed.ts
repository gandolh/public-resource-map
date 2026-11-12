import fs from "node:fs";
import { loadSeedConfig } from "../config.js";
import { createDb } from "./index.js";
import { fixture, seedDatabase } from "./seed-data.js";
import { createAccounts, createSqliteStore } from "../../vendor/ward/ward-auth.js";
import { ROLES, storeHandle } from "../plugins/auth/index.js";

/**
 * `npm run db:seed -w backend`: reset the dev database to the Timișoara +
 * București seed (seed-data.ts). Set SEED_DEMO_USERNAME (and, the first time,
 * SEED_DEMO_PASSWORD) to give that local user favourites and a notification;
 * the user is created if it does not exist. No credential lives in this repo.
 */
const settings = loadSeedConfig();
const dbPath = settings.databasePath;

// Seeding resets every place, event, favourite and notification. It is for
// dev and e2e databases, never a live one.
if (settings.production) {
  console.error("Refusing to seed a production server (its settings say production): seeding wipes places and events.");
  process.exit(1);
}
if (!fs.existsSync(dbPath)) {
  console.error("Database not found at", dbPath, "— run db:migrate first");
  process.exit(1);
}

const { db, sqlite } = createDb(dbPath);
console.log("Seeding Timișoara + București (resets places, events, favourites, notifications)...");
try {
  const demoName = settings.demoUsername;
  let demoSubject: string | undefined;
  if (demoName) {
    const accounts = createAccounts({ store: createSqliteStore(storeHandle(sqlite)) });
    const existing = await accounts.findUserByUsername(demoName);
    const password = settings.demoPassword;
    if (!existing && !password) throw new Error("SEED_DEMO_USERNAME is new: set SEED_DEMO_PASSWORD too");
    demoSubject = (existing ?? (await accounts.createUser({ username: demoName, password, role: ROLES.user }))).id;
  }
  const r = seedDatabase(db, { demoSubject });
  console.log(`  ✓ ${r.places} places (OSM fixture captured ${fixture.capturedAt}, plus event venues)`);
  console.log(`  ✓ ${r.events} synthetic events`);
  if (r.demo) console.log(`  ✓ demo user ${demoName}: 2 followed places, 1 saved event, 1 notification`);
  console.log("Seed complete.");
} catch (err) {
  console.error("Seed failed:", err);
  process.exitCode = 1;
} finally {
  sqlite.close();
}
