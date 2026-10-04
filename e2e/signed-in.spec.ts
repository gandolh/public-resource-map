import { randomUUID } from "node:crypto";
import { test, expect, signIn, seededPlace, SEED } from "./fixtures";
import { osmKey, seedId } from "../backend/src/db/seed-ids";

/**
 * Signed in, through the fake Ward (decided 2026-10-04). These were TP-05 to
 * TP-07's manual cases until then. Each spec signs in as its own subject,
 * except the bell, which reads the seeded demo user.
 */

const fresh = () => `e2e-${randomUUID()}`;

test("the demo user's bell holds one unread item, and opening it marks it read", async ({ page }) => {
  await signIn(page, { subject: "e2e-demo" });
  await page.goto("");
  const bell = page.getByRole("button", { name: "Notifications, 1 unread" });
  await expect(bell).toBeVisible();
  await bell.click();
  await expect(page.getByText(/^\d+ new events? at Muzeul de Artă$/)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Notifications", exact: true })).toBeVisible();
});

test("following a place from its page sticks, and unfollowing undoes it", async ({ page, request }) => {
  await signIn(page, { subject: fresh() });
  const theatre = await seededPlace(request, seedId(osmKey("way", "194401985")));
  await page.goto(`places/${theatre.id}`);
  await page.getByRole("button", { name: `Follow ${theatre.name}` }).click();
  await expect(page.getByRole("button", { name: `Unfollow ${theatre.name}` })).toBeVisible();

  await page.reload();
  const unfollow = page.getByRole("button", { name: `Unfollow ${theatre.name}` });
  await expect(unfollow).toBeVisible();
  await unfollow.click();
  await expect(page.getByRole("button", { name: `Follow ${theatre.name}` })).toBeVisible();
});

test("an admin reaches the review queue and the sources", async ({ page }) => {
  await signIn(page, { subject: fresh(), grants: { prm: ["admin"] } });
  await page.goto("admin");
  await expect(page.getByRole("heading", { level: 1, name: "Review queue" })).toBeVisible();
  await page.getByRole("link", { name: "Sources" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Sources" })).toBeVisible();
});

test("a signed-in person without the admin grant is told so at /admin", async ({ page }) => {
  await signIn(page, { subject: fresh() });
  await page.goto("admin");
  await expect(page.getByText("You don't have access here")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Review queue" })).toHaveCount(0);
});

test("signed in, the archive opens on My past events", async ({ page }) => {
  await signIn(page, { subject: fresh() });
  await page.goto("archive");
  await expect(page.getByRole("tab", { name: "My past events" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText("Nothing in your history yet")).toBeVisible();
});

test("the place a demo user follows shows as followed", async ({ page, request }) => {
  await signIn(page, { subject: "e2e-demo" });
  const museum = await seededPlace(request, SEED.places.tmArtMuseum);
  await page.goto(`places/${museum.id}`);
  await expect(page.getByRole("button", { name: `Unfollow ${museum.name}` })).toBeVisible();
});
