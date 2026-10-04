import { test, expect, seededPlace, SEED } from "./fixtures";

/** Brief 13's public interactions: recovery, the lens banner, selection, the phone's attribution. */

test("zero results offers each filter back as its own chip", async ({ page }) => {
  await page.goto("");
  await page.getByPlaceholder("Search for a place").first().fill("zzzz-nothing");
  await expect(page.getByText("No place matches “zzzz-nothing”")).toBeVisible();
  await page.getByRole("radio", { name: "Today" }).click();

  const searchChip = page.getByRole("button", { name: "Remove the “zzzz-nothing” filter" });
  const lensChip = page.getByRole("button", { name: "Remove the Today filter" });
  await expect(searchChip).toBeVisible();
  await expect(lensChip).toBeVisible();

  // Removing one filter keeps the other.
  await searchChip.click();
  await expect(page.getByRole("radio", { name: "Today" })).toHaveAttribute("aria-checked", "true");
});

test("the timing lens says what it hides, and Show all brings it back", async ({ page }) => {
  await page.goto("");
  await page.getByRole("radio", { name: "Today" }).click();
  const banner = page.getByRole("status").filter({ hasText: "Only places with events today" });
  await expect(banner).toBeVisible();
  await banner.getByRole("button", { name: "Show all" }).click();
  await expect(page.getByRole("radio", { name: "Anytime" })).toHaveAttribute("aria-checked", "true");
  await expect(banner).toHaveCount(0);
});

test("opening a place dims the others", async ({ page, request }) => {
  const museum = await seededPlace(request, SEED.places.tmArtMuseum);
  await page.goto("");
  await expect(page.locator(".has-selection")).toHaveCount(0);
  await page.goto(`places/${museum.id}`);
  await expect(page.locator(".has-selection")).toHaveCount(1);
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 375, height: 740 }, hasTouch: true, isMobile: true });

  test("the attribution folds behind an i that opens it", async ({ page }) => {
    await page.goto("");
    const attribution = page.locator(".leaflet-control-attribution");
    const toggle = page.getByRole("button", { name: "Map sources" });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(attribution).toBeHidden();
    await toggle.tap();
    await expect(attribution).toBeVisible();
    await expect(attribution).toContainText("OpenStreetMap contributors");
  });
});
