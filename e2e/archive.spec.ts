import { test, expect } from "./fixtures";

/** Brief 14, signed out: the city's archive is public; "mine" asks for sign-in. */

test("signed out, the archive opens on the city tab, and My past events asks to sign in", async ({ page }) => {
  await page.goto("archive");
  await expect(page.getByRole("heading", { level: 1, name: "Archive" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "All of Timișoara" })).toHaveAttribute("aria-selected", "true");
  // Either a list or the empty state: the seed's past events depend on the hour.
  await expect(
    page.getByText(/^\d+ events?$/).or(page.getByText("No past events recorded in Timișoara yet")),
  ).toBeVisible();

  await page.getByRole("tab", { name: "My past events" }).click();
  await expect(page.getByText("Sign in to see your history")).toBeVisible();
  await expect(page.getByRole("link", { name: "Log in" }).last()).toHaveAttribute("href", /next=%2Fprm%2Farchive/);
});

test("the desktop nav and what's on both lead to the archive", async ({ page }) => {
  await page.goto("whats-on");
  await page.getByRole("link", { name: "Past events" }).click();
  await expect(page).toHaveURL(/\/prm\/archive$/);
  await page.getByRole("link", { name: "Map" }).first().click();
  await page.getByRole("link", { name: "Archive" }).first().click();
  await expect(page).toHaveURL(/\/prm\/archive$/);
});
