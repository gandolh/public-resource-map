import { API, test, expect, seededPlace, SEED } from "./fixtures";

/** A shared place link: the map, centred on the place, with its panel open. */

test("a cold deep link opens the place with its programme and sources", async ({ page, request }) => {
  // The seed dates events from the current time, so pick, at run time, a place
  // whose upcoming event links its original listing.
  const res = await request.get(`${API}/whats-on`, { params: { pageSize: 100 } });
  const { data } = (await res.json()) as {
    data: { event: { sourceUrl: string | null }; place: { id: string; name: string } }[];
  };
  const item = data.find((i) => i.event.sourceUrl);
  if (!item) throw new Error("the seed has no upcoming event with a source URL");

  await page.goto(`places/${item.place.id}`);
  await expect(page.getByRole("heading", { name: item.place.name })).toBeVisible();
  await expect(page.locator(".leaflet-container")).toBeVisible();
  // Its events credit the publisher and link the original listing.
  await expect(page.getByText("Source:").first()).toBeVisible();
  await expect(
    page.locator("p", { hasText: "Source:" }).getByRole("link").first(),
  ).toHaveAttribute("href", /^https:\/\//);
});

test("a link to a place in another city switches the city", async ({ page, request }) => {
  const bucharest = await seededPlace(request, SEED.places.buArtMuseum);
  await page.goto(`places/${bucharest.id}`);
  await expect(page.getByRole("heading", { name: bucharest.name })).toBeVisible();
  await expect(page.getByRole("button", { name: "Change city" })).toHaveText(/București/);
});
