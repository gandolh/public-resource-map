import { test, expect, seededPlace, SEED } from "./fixtures";

/**
 * Signed out: the star explains itself and its sign-in link carries
 * the favourite through prm's login page, back to this page.
 */
test("a signed-out star offers sign-in that returns here with the favourite", async ({ page, request }) => {
  const museum = await seededPlace(request, SEED.places.tmArtMuseum);
  await page.goto(`places/${museum.id}`);
  // The map writes its view into the URL first.
  await expect(page).toHaveURL(/\?city=timisoara$/);
  await page.getByRole("button", { name: `Follow ${museum.name}` }).click();
  await expect(page.getByRole("heading", { name: "Follow the places you like" })).toBeVisible();

  // The way back keeps the map's view (its city) beside the favourite to finish. The router
  // renders a URL change as a transition, so the link may lag the address bar for a moment.
  const next = async () => {
    const href = await page.getByRole("link", { name: "Log in" }).last().getAttribute("href");
    return new URL(href ?? "", "http://x").searchParams.get("next");
  };
  await expect.poll(next).toBe(`/prm/places/${museum.id}?city=timisoara&favorite=place%3A${museum.id}`);
  // The bell is for signed-in people only.
  await expect(page.getByRole("button", { name: /Notifications/ })).toHaveCount(0);
});
