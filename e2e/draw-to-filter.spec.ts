import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";

/**
 * Draw-to-filter (brief 15), with real mouse input: Playwright's mouse sends
 * genuine pointer events, so this drives the same path a hand does.
 */

const placesLabel = (page: Page) => page.locator("p.tnum").filter({ hasText: /places?/ }).first();
const count = async (page: Page) => Number((await placesLabel(page).textContent())?.match(/\d+/)?.[0]);

async function mapBox(page: Page) {
  const box = await page.locator(".leaflet-container").boundingBox();
  if (!box) throw new Error("no map");
  return box;
}

test("a freehand loop narrows the map to the places inside it", async ({ page }) => {
  await page.goto("");
  await expect(placesLabel(page)).toHaveText(/\d+ places?/);
  const all = await count(page);

  await page.getByRole("button", { name: "Draw an area" }).click();
  await expect(page.getByText("Circle the area: press and drag.")).toBeVisible();

  // A small loop around the city centre, where the seeded places cluster.
  const box = await mapBox(page);
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const r = 70;
  await page.mouse.move(cx + r, cy);
  await page.mouse.down();
  for (let i = 1; i <= 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    await page.mouse.move(cx + r * Math.cos(a), cy + r * Math.sin(a));
  }
  await page.mouse.up();

  await expect(placesLabel(page)).toHaveText(/in this area/);
  expect(await count(page)).toBeLessThan(all);
  await expect(page.getByRole("button", { name: "Remove the drawn area" })).toBeVisible();

  await page.getByRole("button", { name: "Remove the drawn area" }).click();
  await expect.poll(() => count(page)).toBe(all);
});

test("a polygon carries over to what's on, and a city change clears it with a notice", async ({ page }) => {
  await page.goto("whats-on");
  const totalText = await page.getByText(/^\d+ events?$/).textContent();
  const total = Number(totalText?.match(/\d+/)?.[0]);

  await page.getByRole("link", { name: "Map" }).first().click();
  await page.getByRole("button", { name: "Draw an area" }).click();
  await page.getByRole("radio", { name: "Polygon" }).click();

  // A tight triangle around the centre, then Done.
  const box = await mapBox(page);
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  for (const [dx, dy] of [[-60, -50], [60, -50], [0, 60]]) {
    await page.mouse.click(cx + dx, cy + dy);
  }
  await page.getByRole("button", { name: "Done" }).click();
  await expect(placesLabel(page)).toHaveText(/in this area/);

  await page.getByRole("link", { name: "What's on" }).first().click();
  await expect(page.getByRole("button", { name: "Remove the drawn area" })).toBeVisible();
  const shown = Number((await page.getByText(/^\d+ events?$/).textContent())?.match(/\d+/)?.[0]);
  expect(shown).toBeLessThanOrEqual(total);

  await page.getByRole("button", { name: "Change city" }).click();
  await page.getByRole("menuitem", { name: /București/ }).click();
  await expect(page.getByText("Your drawn area was cleared: it belonged to another city.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Remove the drawn area" })).toHaveCount(0);
});
