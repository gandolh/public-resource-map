import type { Page } from "@playwright/test";
import { test, expect } from "./fixtures";

/** Light, Dark and System, kept on the device, light on a first visit (base-ui rule 14). */

const html = (page: Page) => page.locator("html");

async function choose(page: Page, name: "Light" | "Dark" | "System") {
  await page.getByRole("button", { name: "Theme" }).click();
  await page.getByRole("menuitemradio", { name }).click();
}

const tileFilter = (page: Page) => page.locator(".leaflet-tile-pane").evaluate((el) => getComputedStyle(el).filter);

test.describe("with the operating system in dark mode", () => {
  test.use({ colorScheme: "dark" });

  test("a first visit is still light", async ({ page }) => {
    await page.goto("");
    await expect(html(page)).toHaveAttribute("data-theme", "light");
    await expect.poll(() => html(page).evaluate((el) => getComputedStyle(el).colorScheme)).toBe("light");
    await page.getByRole("button", { name: "Theme" }).click();
    await expect(page.getByRole("menuitemradio", { name: "Light" })).toBeChecked();
  });

  test("choosing Dark sets it, keeps it across a reload, and darkens the map", async ({ page }) => {
    await page.goto("");
    await expect(page.locator(".leaflet-container")).toBeVisible();
    const light = await tileFilter(page);

    await choose(page, "Dark");
    await expect(html(page)).toHaveAttribute("data-theme", "dark");
    await expect.poll(() => html(page).evaluate((el) => getComputedStyle(el).colorScheme)).toBe("dark");
    // The map follows: without a CARTO key the standard tiles are filtered, inverted in dark.
    await expect.poll(() => tileFilter(page)).not.toBe(light);
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#0b0d11");

    await page.reload();
    await expect(html(page)).toHaveAttribute("data-theme", "dark");
  });
});

test("choosing System follows an emulated colour-scheme change, and Light stops following", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("");
  await choose(page, "System");
  await expect(html(page)).toHaveAttribute("data-theme", "light");

  await page.emulateMedia({ colorScheme: "dark" });
  await expect(html(page)).toHaveAttribute("data-theme", "dark");

  await choose(page, "Light");
  await expect(html(page)).toHaveAttribute("data-theme", "light");
  await page.emulateMedia({ colorScheme: "light" });
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(html(page)).toHaveAttribute("data-theme", "light");
});
