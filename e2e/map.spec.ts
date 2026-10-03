import { test, expect } from "./fixtures";

/** The place-centric map: pins and clusters, chips and the timing lens. */

const count = async (text: Promise<string | null>) => Number((await text)?.match(/\d+/)?.[0]);
const label = (page: import("@playwright/test").Page) =>
  page.locator("p.tnum").filter({ hasText: /places?/ }).first();

test("opens on Timișoara with its places on the map", async ({ page }) => {
  await page.goto("");
  await expect(page.getByRole("button", { name: "Change city" })).toHaveText(/Timișoara/);
  await expect(label(page)).toHaveText(/\d+ places? · \d+ with events/);
  expect(await count(label(page).textContent())).toBeGreaterThan(0);
  // Pins or clusters: at city zoom, nearby places collapse into counts.
  await expect(page.locator(".cm-pin, .cm-cluster").first()).toBeVisible();
});

test("a category chip and the timing lens narrow the same count", async ({ page }) => {
  await page.goto("");
  await expect(label(page)).toHaveText(/\d+ places?/);
  const all = await count(label(page).textContent());

  await page.getByRole("button", { name: "Museums" }).click();
  await expect.poll(() => count(label(page).textContent())).toBeLessThan(all);

  await page.getByRole("button", { name: "All", exact: true }).first().click();
  await expect.poll(() => count(label(page).textContent())).toBe(all);

  // The lens hard-filters: places with nothing on that day leave the map.
  await page.getByRole("radio", { name: "Today" }).click();
  await expect.poll(() => count(label(page).textContent())).toBeLessThan(all);
});

test("the attribution credits OpenStreetMap contributors and links About the data", async ({ page }) => {
  await page.goto("");
  const attribution = page.locator(".leaflet-control-attribution");
  await expect(attribution).toContainText("OpenStreetMap contributors");
  await attribution.getByRole("link", { name: "About the data" }).click();
  await expect(page).toHaveURL(/\/prm\/about-data$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("About the data");
});
