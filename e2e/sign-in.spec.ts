import { test, expect } from "./fixtures";

/**
 * TP-05, signed out (the e2e stack has no Ward session; see brief 17): the
 * navbar's way in is Ward, and it comes back to the page it left from. The
 * round trip itself is walked by hand against the local Ward.
 */
test("Log in and Create account return to the page they were opened on", async ({ page }) => {
  await page.goto("whats-on?x=1");
  await page.getByRole("button", { name: "Account" }).click();
  for (const name of ["Log in", "Create account"]) {
    const href = await page.getByRole("menuitem", { name }).getAttribute("href");
    expect(new URL(href!, "http://x").searchParams.get("next")).toBe("/prm/whats-on?x=1");
  }
});
