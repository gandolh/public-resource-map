import { test as base, expect, type APIRequestContext } from "@playwright/test";

/** The e2e backend (playwright.config.ts), for looking seeded rows up by name. */
export const API = "http://127.0.0.1:3101/api";

interface SeededPlace {
  id: string;
  name: string;
  city: string;
  coordinates: { lat: number; lng: number };
  upcomingEventCount?: number;
}

/** Seed ids are stable (brief 08), so specs name the rows they mean. */
export { SEED } from "../backend/src/db/seed-ids";

/** A seeded place, read back through the API the UI uses. */
export async function seededPlace(request: APIRequestContext, id: string): Promise<SeededPlace> {
  const res = await request.get(`${API}/places/${id}`);
  expect(res.ok(), `seeded place ${id}`).toBe(true);
  return (await res.json()) as SeededPlace;
}

export const test = base.extend({
  // English, so assertions read the way the specs do. Romanian stays the
  // product default; this only picks the remembered choice.
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("civicmap-lang", JSON.stringify("en"));
    });
    await use(page);
  },
});

export { expect };
