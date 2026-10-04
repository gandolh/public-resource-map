import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

/**
 * The automated e2e suite (brief 17). `npm run test:e2e` boots its own backend
 * and UI on ports of their own, against a throwaway database that is migrated
 * and seeded on every run, so it never touches dev data or a running dev
 * server. The manual visual-audit hub stays in `playwright/` (gitignored).
 */

const API_PORT = 3101;
const UI_PORT = 5174;
const WARD_PORT = 3102;
const WARD_APP_KEY = "e2e-app-key";
const BASE = "/prm/";
const db = path.resolve(__dirname, "e2e/.data/app.e2e.db");

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
        " && npx tsx src/db/migrate.ts && npx tsx src/db/seed.ts && npx tsx src/index.ts",
      cwd: "backend",
      url: `http://127.0.0.1:${API_PORT}/api/places?pageSize=1`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        PORT: String(API_PORT),
        DATABASE_PATH: db,
        // The fake Ward below. Signed-in specs get a token from it
        // (e2e/fixtures.ts → signIn) and the backend verifies and introspects
        // that token for real.
        WARD_PUBLIC_ORIGIN: `http://127.0.0.1:${WARD_PORT}`,
        WARD_API_BASE_PATH: "/ward-api",
        WARD_APP_KEY,
        // A demo user for the bell (brief 08): two followed places, one saved
        // event, one unread new-events item.
        SEED_DEMO_SUBJECT: "e2e-demo",
      },
    },
    {
      // A stand-in Ward (decided 2026-10-04): JWKS, introspection, and a
      // test-only sign-in. See e2e/fake-ward/server.ts.
      command: "npx tsx e2e/fake-ward/server.ts",
      url: `http://127.0.0.1:${WARD_PORT}/ward-api/health`,
      reuseExistingServer: false,
      timeout: 60_000,
      env: { FAKE_WARD_PORT: String(WARD_PORT), FAKE_WARD_APP_KEY: WARD_APP_KEY },
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
