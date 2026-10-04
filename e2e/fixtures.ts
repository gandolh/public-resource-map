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

/** The fake Ward the e2e stack runs (playwright.config.ts, e2e/fake-ward/). */
const FAKE_WARD = "http://127.0.0.1:3102/ward-api";

/**
 * Sign the page's browser in as a Ward subject: ask the fake Ward for a token
 * and set it as the `ward_session` cookie, the way Ward's login would. The
 * backend then verifies and introspects it for real. Use a fresh subject per
 * spec unless a spec means the seeded demo user ("e2e-demo"), since specs run
 * in parallel against one database.
 */
export async function signIn(
  page: Page,
  { subject, grants = { prm: ["user"] } }: { subject: string; grants?: Record<string, string[]> },
): Promise<void> {
  const res = await page.request.post(`${FAKE_WARD}/test/sign-in`, {
    data: { subject, username: subject, grants },
  });
  expect(res.ok()).toBe(true);
  const { token } = (await res.json()) as { token: string };
  await page.context().addCookies([
    { name: "ward_session", value: token, domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" },
  ]);
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
