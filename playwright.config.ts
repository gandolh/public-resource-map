import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import { randomBytes } from "node:crypto";

/**
 * The automated e2e suite (brief 17). `npm run test:e2e` boots its own backend
 * and UI on ports of their own, against a throwaway database that is migrated
 * and seeded on every run, so it never touches dev data or a running dev
 * server. The manual visual-audit hub stays in `playwright/` (gitignored).
 */

const API_PORT = 3101;
const UI_PORT = 5174;
const BASE = "/prm/";
const db = path.resolve(__dirname, "e2e/.data/app.e2e.db");

/**
 * The seeded users' password, made up per run: no credential is written in the
 * repo. Set here, in the runner, before the workers start, so they inherit it
 * (e2e/fixtures.ts reads it to sign in).
 */
process.env.PRM_E2E_PASSWORD ??= randomBytes(18).toString("base64url");

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${UI_PORT}${BASE}`,
    trace: "retain-on-failure",
    locale: "en-GB",
    timezoneId: "Europe/Bucharest",
    // Timișoara's centre. Every spec runs as a visitor standing in the city
    // the map opens on (the old suite mocked New York).
    geolocation: { latitude: 45.7537, longitude: 21.2257 },
    permissions: ["geolocation"],
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      // Fresh database every run: drop it, migrate, seed (synthetic events are
      // dated from today), then serve.
      command:
        `rm -f "${db}" "${db}-wal" "${db}-shm" && mkdir -p "$(dirname "${db}")"` +
        " && npx tsx src/db/migrate.ts && npx tsx src/db/seed.ts && npx tsx src/db/seed-users.ts" +
        " && npx tsx src/index.ts",
      cwd: "backend",
      url: `http://127.0.0.1:${API_PORT}/api/places?pageSize=1`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        PORT: String(API_PORT),
        DATABASE_PATH: db,
        // prm's own accounts (brief 24 of Ward's corpus), with no Ward: the
        // browser posts from the UI's origin, and the cookie is scoped to the
        // API prefix there.
        PUBLIC_ORIGIN: `http://localhost:${UI_PORT}`,
        PRM_BASE: BASE,
        // A demo user for the bell (brief 08): two followed places, one saved
        // event, one unread new-events item.
        SEED_DEMO_USERNAME: "e2e-demo",
        SEED_DEMO_PASSWORD: process.env.PRM_E2E_PASSWORD,
        // And an admin, through the same script a deploy runs.
        SEED_USERNAME: "e2e-admin",
        SEED_PASSWORD: process.env.PRM_E2E_PASSWORD,
        SEED_ROLE: "admin",
      },
    },
    {
      command: `npm run dev -w ui -- --port ${UI_PORT} --strictPort`,
      url: `http://localhost:${UI_PORT}${BASE}`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        PORT: String(API_PORT), // where the dev proxy sends /prm-api
        PRM_BASE: BASE,
        VITE_API_URL: "/prm-api",
      },
    },
  ],
});
