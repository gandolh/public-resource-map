import { test, expect, placeNamed } from "./fixtures";

/**
 * Brief 05, signed out (the e2e stack has no Ward session; see brief 17): the
 * star explains itself and its sign-in link carries the favourite through
 * Ward, back to this page. The signed-in loop was walked against the local Ward.
 */
test("a signed-out star offers sign-in that returns here with the favourite", async ({ page, request }) => {
  const museum = await placeNamed(request, "Muzeul de Artă Timișoara");
  await page.goto(`places/${museum.id}`);
  await page.getByRole("button", { name: `Follow ${museum.name}` }).click();
  await expect(page.getByRole("heading", { name: "Follow the places you like" })).toBeVisible();

  const href = await page.getByRole("link", { name: "Log in" }).last().getAttribute("href");
  const next = new URL(href!, "http://x").searchParams.get("next");
  expect(next).toBe(`/prm/places/${museum.id}?favorite=place%3A${museum.id}`);
  // The bell is for signed-in people only.
  await expect(page.getByRole("button", { name: /Notifications/ })).toHaveCount(0);
});
