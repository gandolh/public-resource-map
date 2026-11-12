import { test, expect, SEED } from "./fixtures";

/** A map URL is a share link: a fresh load opens the same city, search, filters and place. */

const MNAR = "Muzeul Național de Artă al României";
const view = "city=bucuresti&q=Muzeul&f=museum";

for (const width of [1280, 390]) {
  test.describe(`at ${width} px`, () => {
    test.use({ viewport: { width, height: 844 } });

    test("a copied place URL opens that city, search, filters and place", async ({ page }) => {
      // A visitor whose stored city is Timișoara opens a București link.
      await page.goto(`places/${SEED.places.buArtMuseum}?${view}`);
      await expect(page.getByRole("heading", { name: MNAR })).toBeVisible();
      await expect(page.getByRole("button", { name: "Change city" }).first()).toHaveText(/București/);
      await expect(page).toHaveURL(new RegExp(`/prm/places/${SEED.places.buArtMuseum}\\?${view}$`));

      // Closing the place keeps the view; the search and the filter are still on.
      await page.keyboard.press("Escape");
      await expect(page).toHaveURL(new RegExp(`/prm/\\?${view}$`));
      if (width >= 768) {
        await expect(page.getByPlaceholder("Search for a place").first()).toHaveValue("Muzeul");
        await expect(page.getByRole("button", { name: "Museums" })).toHaveAttribute("aria-pressed", "true");
      }
    });

    test("the old /map link with place= lands on the place, view and all", async ({ page }) => {
      await page.goto(`map?${view}&place=${SEED.places.buArtMuseum}`);
      await expect(page.getByRole("heading", { name: MNAR })).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`/prm/places/${SEED.places.buArtMuseum}\\?${view}$`));
    });
  });
}

test("the map writes its state with replace, so Back leaves the map", async ({ page }) => {
  await page.goto("about-data");
  await page.getByRole("link", { name: "Map" }).first().click();
  await expect(page).toHaveURL(/\/prm\/\?city=timisoara$/);

  await page.getByPlaceholder("Search for a place").first().fill("Muzeul");
  await page.getByRole("button", { name: "Museums" }).click();
  await expect(page).toHaveURL(/\/prm\/\?city=timisoara&q=Muzeul&f=museum$/);

  // A drag puts the camera in the URL, also without a new history entry.
  const map = page.locator(".leaflet-container");
  const box = await map.boundingBox();
  if (!box) throw new Error("no map");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 - 120, box.y + box.height / 2 + 40, { steps: 8 });
  await page.mouse.up();
  await expect(page).toHaveURL(/&map=\d+\/[\d.]+\/[\d.]+$/);

  // The copied URL reopens that view.
  const shared = page.url();
  await page.goBack();
  await expect(page).toHaveURL(/\/prm\/about-data$/);
  await page.goto(shared);
  await expect(page.getByPlaceholder("Search for a place").first()).toHaveValue("Muzeul");
  await expect(page.getByRole("button", { name: "Museums" })).toHaveAttribute("aria-pressed", "true");
  await expect(page).toHaveURL(shared);
});
