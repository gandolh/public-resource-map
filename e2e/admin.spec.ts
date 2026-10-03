import { test, expect } from "./fixtures";

/**
 * The admin shell (brief 16), signed out: the e2e stack runs without a Ward
 * session (see brief 17), so this checks the gate, not the review UI. The
 * review UI was walked by hand against the local Ward.
 */
test("a signed-out visitor at /admin is asked to sign in, not shown the queue", async ({ page }) => {
  await page.goto("admin");
  await expect(page.getByText("Sign in as an admin")).toBeVisible();
  await expect(page.getByRole("link", { name: "Log in" })).toHaveAttribute("href", /\/ward\/login\?/);
  await expect(page.getByRole("heading", { name: "Review queue" })).toHaveCount(0);
});
