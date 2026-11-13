import { writeFileSync } from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";
import { test, expect, signIn, SEED } from "./fixtures";

/**
 * Screenshots of every screen at both widths and both themes, for comparing a build with its
 * comps. Runs only when SHOTS_DIR names a folder, so `npm run test:e2e` skips it:
 * `SHOTS_DIR=<dir> npx playwright test shots`.
 */
const dir = process.env.SHOTS_DIR;
test.skip(!dir, "set SHOTS_DIR to take screenshots");

const WIDTHS = [
  { name: "1280", width: 1280, height: 800 },
  { name: "390", width: 390, height: 844 },
] as const;

/** București at street zoom with Museums and Libraries chosen, the map comp's view. */
const MAP_VIEW = "?city=bucuresti&f=museum,library&map=16/44.4393/26.0966";

async function settle(page: Page) {
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.waitForTimeout(500);
}

for (const theme of ["light", "dark"] as const) {
  for (const size of WIDTHS) {
    test.describe(`${theme} ${size.name}`, () => {
      test.use({ viewport: { width: size.width, height: size.height } });

      test.beforeEach(async ({ page }) => {
        await page.addInitScript((t) => window.localStorage.setItem("vite-ui-theme", JSON.stringify(t)), theme);
      });

      const shot = async (page: Page, screen: string) => {
        await settle(page);
        const file = path.join(dir!, `${screen}-${theme}-${size.name}`);
        await page.screenshot({ path: `${file}.png` });
        // Where the live map shows (above a sheet), so a comparison with a comp can leave it out.
        const mask = await page.evaluate(() => {
          const map = document.querySelector(".leaflet-container")?.getBoundingClientRect();
          if (!map) return null;
          const sheet = document.querySelector('[role="dialog"]')?.getBoundingClientRect();
          const bottom = Math.min(map.bottom, sheet && sheet.top > 100 ? sheet.top : map.bottom);
          return [Math.max(0, map.left), Math.max(0, map.top), map.width, bottom - map.top];
        });
        writeFileSync(`${file}.json`, JSON.stringify({ mask }));
      };

      test("map", async ({ page }) => {
        await page.goto(MAP_VIEW);
        await expect(page.locator(".cm-pin, .cm-cluster").first()).toBeVisible();
        await shot(page, "map");
      });

      test("map-city", async ({ page }) => {
        await page.goto("");
        await expect(page.locator(".cm-pin, .cm-cluster").first()).toBeVisible();
        await shot(page, "map-city");
      });

      test("place", async ({ page }) => {
        await page.goto(`places/${SEED.places.buArtMuseum}?city=bucuresti&map=16/44.4393/26.0966`);
        await expect(page.getByRole("heading", { name: /Muzeul Național de Artă/ })).toBeVisible();
        await shot(page, "place");
      });

      test("whats-on", async ({ page }) => {
        await page.goto("whats-on?city=bucuresti");
        await page.goto("");
        await page.getByRole("button", { name: "Change city" }).click();
        await page.getByRole("menuitem", { name: "București" }).click();
        await page.getByRole("link", { name: "What's on" }).first().click();
        await expect(page.getByRole("heading", { level: 1 })).toContainText("What's on");
        await shot(page, "whats-on");
      });

      test("categories", async ({ page }) => {
        test.skip(size.width > 900, "the phone's sheet");
        await page.goto(MAP_VIEW);
        await page.getByRole("button", { name: /^Categories/ }).click();
        await shot(page, "categories");
      });

      test("sheet-full", async ({ page }) => {
        test.skip(size.width > 900, "the phone's sheet");
        await page.goto(`places/${SEED.places.buArtMuseum}?city=bucuresti&map=16/44.4393/26.0966`);
        await page.getByRole("button", { name: "Expand the place details" }).click();
        await shot(page, "sheet-full");
      });

      test("archive", async ({ page }) => {
        await signIn(page, "demo");
        await page.goto("archive");
        await shot(page, "archive");
      });

      test("about-data", async ({ page }) => {
        await page.goto("about-data");
        await shot(page, "about-data");
      });

      test("login", async ({ page }) => {
        await page.goto("login");
        await shot(page, "login");
      });

      test("register", async ({ page }) => {
        await page.goto("register");
        await shot(page, "register");
      });

      test("settings", async ({ page }) => {
        await signIn(page, "demo");
        await page.goto("settings");
        await shot(page, "settings");
      });

      test("admin-review", async ({ page }) => {
        await signIn(page, "admin");
        await page.goto("admin");
        await shot(page, "admin-review");
      });

      test("admin-sources", async ({ page }) => {
        await signIn(page, "admin");
        await page.goto("admin/sources");
        await shot(page, "admin-sources");
      });

      test("menu-account", async ({ page }) => {
        await page.goto("");
        await page.getByRole("button", { name: "Account" }).click();
        await shot(page, "menu-account");
      });

      test("menu-city", async ({ page }) => {
        await page.goto("");
        await page.getByRole("button", { name: "Change city" }).click();
        await shot(page, "menu-city");
      });

      test("not-found", async ({ page }) => {
        await page.goto("no-such-page");
        await shot(page, "not-found");
      });
    });
  }
}
