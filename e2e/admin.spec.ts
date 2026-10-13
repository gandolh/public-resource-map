import { test, expect } from "./fixtures";

/**
 * The admin shell (brief 16), signed out: the gate, and its way to prm's own
 * login page. The signed-in admin is in signed-in.spec.ts.
 */
test("a signed-out visitor at /admin is asked to sign in, not shown the queue", async ({ page }) => {
  await page.goto("admin");
  await expect(page.getByText("Sign in as an admin")).toBeVisible();
  await expect(page.getByRole("link", { name: "Log in" })).toHaveAttribute("href", /\/prm\/login\?next=%2Fprm%2Fadmin$/);
  await expect(page.getByRole("heading", { name: "Review queue" })).toHaveCount(0);
});
