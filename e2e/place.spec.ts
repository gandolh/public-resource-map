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
  await expect(page.locator("p", { hasText: "Source:" }).getByRole("link").first()).toHaveAttribute(
    "href",
    /^https:\/\//,
  );
});

test("a link to a place in another city switches the city", async ({ page, request }) => {
  const bucharest = await seededPlace(request, SEED.places.buArtMuseum);
  await page.goto(`places/${bucharest.id}`);
  await expect(page.getByRole("heading", { name: bucharest.name })).toBeVisible();
  await expect(page.getByRole("button", { name: "Change city" })).toHaveText(/București/);
});

test("the tab names the place, and leaving it gives the right title back", async ({ page, request }) => {
  const place = await seededPlace(request, SEED.places.tmArtMuseum);

  await page.goto(`places/${place.id}`);
  await expect(page).toHaveTitle(`${place.name} — CivicMap`);

  // Closing returns to the map, whose meta did not change, so React does not
  // rewrite the title; the place gives the map's back itself.
  await page.getByRole("button", { name: "Close panel" }).click();
  await expect(page).toHaveTitle(/^CivicMap — /);

  // Leaving for a page with a title of its own must not be overwritten by it.
  await page.goto(`places/${place.id}`);
  await expect(page).toHaveTitle(`${place.name} — CivicMap`);
  await page.getByRole("link", { name: "What's on" }).first().click();
  await expect(page).toHaveTitle("Ce se întâmplă — CivicMap");
});

test("Escape closes the follow popover first, and the place only on the next press", async ({ page, request }) => {
  const place = await seededPlace(request, SEED.places.tmArtMuseum);
  await page.goto(`places/${place.id}`);
  await expect(page.getByRole("heading", { name: place.name })).toBeVisible();

  // Signed out, the star explains itself in a popover.
  await page.getByRole("button", { name: `Follow ${place.name}` }).click();
  const popover = page.getByRole("dialog").filter({ hasText: "Sign in" });
  await expect(popover).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(popover).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp(`places/${place.id}(\\?[^/]*)?$`));
  await expect(page.getByRole("heading", { name: place.name })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/prm\/(\?[^/]*)?$/);
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  // base-ui rule 15 / brief 04, decision 3: the sheet is a non-modal Drawer, so the map behind a peeking
  // sheet still takes pans and pin taps.
  test("the map stays usable at the sheet's peek, and the sheet follows a swipe", async ({ page, request }) => {
    const place = await seededPlace(request, SEED.places.tmArtMuseum);
    await page.goto(`places/${place.id}`);
    const sheet = page.getByRole("dialog", { name: place.name });
    await expect(sheet).toBeVisible();
    const top = async () => {
      const box = await sheet.boundingBox();
      if (!box) throw new Error("the sheet is not on screen");
      return Math.round(box.y);
    };
    // The sheet rests at the height of its head, actions and first fact, above the tab bar,
    // (a long name wraps and takes more; the next test measures a one-line name).
    await expect.poll(top).toBeGreaterThan(500);
    await expect(page.getByRole("link", { name: "What's on" })).toBeInViewport();

    // The map pans.
    const pane = page.locator(".leaflet-map-pane");
    const before = await pane.evaluate((el) => (el as HTMLElement).style.transform);
    await page.mouse.move(200, 250);
    await page.mouse.down();
    await page.mouse.move(120, 280, { steps: 8 });
    await page.mouse.up();
    await expect.poll(() => pane.evaluate((el) => (el as HTMLElement).style.transform)).not.toBe(before);
    await expect(sheet).toBeVisible();

    // A pin above the sheet opens another place.
    // The path, not the URL: the pan itself rewrites the query (the camera).
    const path = () => new URL(page.url()).pathname;
    const here = path();
    await page.waitForTimeout(800);
    const pins = page.locator(".cm-pin");
    const count = await pins.count();
    for (let i = 0; i < count && path() === here; i++) {
      const box = await pins.nth(i).boundingBox();
      if (box && box.x > 0 && box.x < 320 && box.y > 190 && box.y + box.height < 500) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(300);
      }
    }
    expect(path()).not.toBe(here);
    await expect(page.getByRole("dialog").filter({ has: page.getByRole("heading") })).toBeVisible();
    await page.goto(`places/${place.id}`);
    await expect(sheet).toBeVisible();
    await page.waitForTimeout(800);
    const rest = await top();

    // The grab bar is a button: it expands the sheet and folds it back.
    await page.getByRole("button", { name: "Expand the place details" }).click();
    await expect.poll(top).toBeLessThan(rest - 200);
    await page.getByRole("button", { name: "Collapse" }).click();
    await expect.poll(top).toBe(rest);

    // A swipe up reaches the full height, a swipe down the peek, and another closes it.
    const drag = async (to: number) => {
      const y = (await top()) + 6;
      // Beside the grab bar, which is a button and takes a press, not a drag.
      await page.mouse.move(60, y);
      await page.mouse.down();
      await page.mouse.move(60, y + to, { steps: 10 });
      await page.mouse.up();
    };
    await drag(-250);
    await expect.poll(top).toBeLessThan(rest - 200);
    await drag(260);
    await expect.poll(top).toBe(rest);
    await drag(260);
    await expect(page).toHaveURL(/\/prm\/(\?[^/]*)?$/);
  });
});

test.describe("the sheet's rest height", () => {
  // A one-line name: the map keeps at least 380px at 390 x 844, and the first fact is whole,
  // with the tab bar on screen, at 390 x 844 and at 360 x 800.
  for (const [width, height] of [
    [390, 844],
    [360, 800],
  ] as const) {
    test(`at ${width} x ${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto(`places/${SEED.places.buArtMuseum}?city=bucuresti`);
      const sheet = page.getByRole("dialog", { name: /Muzeul Național de Artă/ });
      await expect(sheet).toBeVisible();
      const tabs = page.getByRole("link", { name: "What's on" });
      await expect(tabs).toBeInViewport();
      const fact = page.locator("dl > div").first();
      await expect(fact).toBeVisible();
      await expect
        .poll(async () => {
          const [s, f, t] = await Promise.all([sheet.boundingBox(), fact.boundingBox(), tabs.boundingBox()]);
          if (!s || !f || !t) return false;
          return f.y + f.height <= t.y + 1 && s.y > 0;
        })
        .toBe(true);
      if (width === 390) {
        const band = await page.locator("header").first().boundingBox();
        const box = await sheet.boundingBox();
        if (!band || !box) throw new Error("no layout");
        const bandBottom = await page.evaluate(() => {
          const el = document.querySelector("main > div > div");
          return el ? el.getBoundingClientRect().bottom : 0;
        });
        expect(box.y - bandBottom).toBeGreaterThanOrEqual(380);
      }
    });
  }
});

test.describe("Copy link", () => {
  const stubClipboard = (blocked: boolean) => (page: import("@playwright/test").Page) =>
    page.addInitScript((isBlocked) => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: () => (isBlocked ? Promise.reject(new Error("blocked")) : Promise.resolve()) },
      });
    }, blocked);

  test("shows the link, selected, when the clipboard is blocked", async ({ page, request }) => {
    const place = await seededPlace(request, SEED.places.tmArtMuseum);
    await stubClipboard(true)(page);
    await page.goto(`places/${place.id}`);
    await page.getByRole("button", { name: "Copy link" }).click();
    const field = page.getByRole("textbox", { name: "Copy link" });
    // The link carries the map's view around the place: here, its city.
    await expect(field).toHaveValue(new RegExp(`/prm/places/${place.id}\\?city=timisoara$`));
    await expect(field).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(field).toHaveCount(0);
    await expect(page.getByRole("heading", { name: place.name })).toBeVisible();
  });

  test("copies, and opens nothing, when the clipboard works", async ({ page, request }) => {
    const place = await seededPlace(request, SEED.places.tmArtMuseum);
    await stubClipboard(false)(page);
    await page.goto(`places/${place.id}`);
    await page.getByRole("button", { name: "Copy link" }).click();
    await expect(page.getByRole("button", { name: "Link copied" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Copy link" })).toHaveCount(0);
  });
});
