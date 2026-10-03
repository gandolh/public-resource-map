import { test, expect } from "./fixtures";

/** The citywide index: the same filters as the map, every row linked to its place. */

test("lists what's on, each event naming its source", async ({ page }) => {
  await page.goto("whats-on");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Timișoara/);
  const rows = page.locator("main li");
  await expect(rows.first()).toBeVisible();
  const n = await rows.count();
  await expect(page.getByText(new RegExp(`^${n} events?$`))).toBeVisible();
  await expect(rows.filter({ hasText: "Source:" })).toHaveCount(n);
});

test("a row opens its place on the map", async ({ page }) => {
  await page.goto("whats-on");
  const row = page.locator("main li a").first();
  await expect(row).toBeVisible();
  await row.click();
  await expect(page).toHaveURL(/\/prm\/places\/[0-9a-f-]+$/);
  await expect(page.locator(".leaflet-container")).toBeVisible();
});
