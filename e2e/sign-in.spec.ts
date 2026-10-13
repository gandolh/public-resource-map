import { randomUUID } from "node:crypto";
import { test, expect } from "./fixtures";

/**
 * TP-05, prm's own way in (brief 24 of Ward's corpus): the navbar leads to
 * prm's login and register pages and comes back to the page it left from.
 * "Sign in with Ward" is off in this stack (no Ward), so the button is not
 * shown; its round trip is walked by hand against the local Ward.
 */
test("Log in and Create account return to the page they were opened on", async ({ page }) => {
  await page.goto("whats-on?x=1");
  await page.getByRole("button", { name: "Account", exact: true }).click();
  for (const name of ["Log in", "Create account"]) {
    const href = await page.getByRole("menuitem", { name }).getAttribute("href");
    expect(new URL(href!, "http://x").searchParams.get("next")).toBe("/prm/whats-on?x=1");
  }
});

test("the demo user logs in on prm's login page and lands back where they started", async ({ page }) => {
  await page.goto("whats-on");
  await page.getByRole("button", { name: "Account", exact: true }).click();
  await page.getByRole("menuitem", { name: "Log in" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Log in" })).toBeVisible();
  // No Ward in this stack, so no Ward button.
  await expect(page.getByRole("button", { name: "Sign in with Ward" })).toHaveCount(0);

  await page.getByLabel("Username").fill("e2e-demo");
  await page.getByLabel("Password").fill(process.env.PRM_E2E_PASSWORD!);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/prm\/whats-on$/);
  await page.getByRole("button", { name: "Account", exact: true }).click();
  await expect(page.getByText("e2e-demo")).toBeVisible();
});

test("a wrong password is refused in prm's words", async ({ page }) => {
  await page.goto("login");
  await page.getByLabel("Username").fill("e2e-demo");
  await page.getByLabel("Password").fill("not the password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("alert")).toHaveText("Wrong username or password.");
});

test("a visitor registers on prm's register page and is signed in, with no mail until Ward is linked", async ({ page }) => {
  const username = `e2e-${randomUUID().slice(0, 8)}`;
  await page.goto("register");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill("a long enough password");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/prm\/$/);

  await page.getByRole("button", { name: "Account", exact: true }).click();
  await page.getByRole("menuitem", { name: "Account settings" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Account settings" })).toBeVisible();
  await expect(page.getByText(`Signed in as ${username}`)).toBeVisible();
  await expect(page.getByText(/so you get no emails/)).toBeVisible();

  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/prm\/$/);
});
