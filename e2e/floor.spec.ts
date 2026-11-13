import type { Page } from "@playwright/test";
import { test, expect, signIn, SEED } from "./fixtures";

/**
 * The floor every screen keeps: a visible focus ring on each tab stop, no running animation when
 * the visitor asks for reduced motion, and no sideways overflow at 390px.
 */
const PUBLIC = [
  { name: "map", path: "" },
  { name: "place", path: `places/${SEED.places.buArtMuseum}?city=bucuresti` },
  { name: "what's on", path: "whats-on" },
  { name: "archive", path: "archive" },
  { name: "about the data", path: "about-data" },
  { name: "log in", path: "login" },
  { name: "register", path: "register" },
  { name: "not found", path: "no-such-page" },
];
const SIGNED_IN = [
  { name: "settings", path: "settings", who: "demo" as const },
  { name: "admin review", path: "admin", who: "admin" as const },
  { name: "admin sources", path: "admin/sources", who: "admin" as const },
];

async function open(page: Page, screen: { path: string; who?: "demo" | "admin" }) {
  if (screen.who) await signIn(page, screen.who);
  await page.goto(screen.path);
  await page.waitForLoadState("networkidle");
}

for (const screen of [...PUBLIC, ...SIGNED_IN]) {
  test(`${screen.name}: every tab stop shows a focus ring`, async ({ page }) => {
    await open(page, screen);
    const stops = 18;
    for (let i = 0; i < stops; i++) {
      await page.keyboard.press("Tab");
      const ring = await page.evaluate(() => {
        let el: Element | null = document.activeElement;
        if (!el || el === document.body) return "none-focused";
        // A control that draws no ring of its own may sit in a wrapper that does (the search field).
        for (; el; el = el.parentElement) {
          const style = getComputedStyle(el);
          if (style.outlineStyle !== "none" && parseFloat(style.outlineWidth) >= 2) return "ring";
          if (el.matches(".cm-pin, .cm-cluster, .leaflet-marker-icon")) return getComputedStyle(el).outlineStyle;
          if (!el.matches(":focus-within")) break;
        }
        return "missing";
      });
      if (ring === "none-focused") break;
      expect(ring, `tab stop ${i + 1} on ${screen.name}`).toBe("ring");
    }
  });

  test(`${screen.name}: reduced motion leaves no running animation`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, screen);
    await page.waitForTimeout(400);
    const running = await page.evaluate(() =>
      document
        .getAnimations()
        .filter((a) => a.playState === "running")
        .map((a) => {
          const timing = a.effect?.getComputedTiming();
          return { duration: Number(timing?.duration ?? 0), iterations: timing?.iterations ?? 1 };
        })
        .filter((a) => a.duration > 1 || a.iterations > 1),
    );
    expect(running).toEqual([]);
  });

  test(`${screen.name}: no sideways overflow at 390px`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, screen);
    const [scroll, inner] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    expect(scroll).toBeLessThanOrEqual(inner);
  });
}
