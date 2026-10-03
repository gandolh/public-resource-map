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

/**
 * Seed IDs are random today (brief 08 has not made them stable), so specs
 * find seeded rows by their real names instead.
 */
export async function placeNamed(request: APIRequestContext, name: string): Promise<SeededPlace> {
  const res = await request.get(`${API}/places`, { params: { pageSize: 1000 } });
  expect(res.ok()).toBe(true);
  const { data } = (await res.json()) as { data: SeededPlace[] };
  const place = data.find((p) => p.name === name);
  if (!place) throw new Error(`no seeded place named ${name}`);
  return place;
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
