import { randomUUID } from "node:crypto";
import { test as base, expect, type APIRequestContext, type Page } from "@playwright/test";

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

/** The e2e backend through the UI's origin, as the browser reaches it. */
const AUTH = "/prm-api/auth";

export type Who = "fresh" | "demo" | "admin";

/**
 * Sign the page's browser in through prm's own accounts (brief 24 of Ward's
 * corpus): `page.request` shares the browser's cookies, so the session cookie
 * lands on the UI's origin under `/prm-api`, as a real sign-in leaves it.
 *
 * - `fresh`: a new account, registered for this spec alone, since specs run
 *   in parallel against one database.
 * - `demo`: the seeded demo user (`e2e-demo`), whose bell holds one item.
 * - `admin`: the seeded admin (`e2e-admin`).
 *
 * The seeded users' password is made up per run (playwright.config.ts).
 */
export async function signIn(page: Page, who: Who): Promise<string> {
  const password = process.env.PRM_E2E_PASSWORD!;
  const username = who === "fresh" ? `e2e-${randomUUID().slice(0, 8)}` : `e2e-${who}`;
  const res =
    who === "fresh"
      ? await page.request.post(`${AUTH}/register`, { data: { username, password } })
      : await page.request.post(`${AUTH}/login`, { data: { username, password } });
  expect(res.ok(), `${who} sign-in: ${res.status()}`).toBe(true);
  return username;
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
