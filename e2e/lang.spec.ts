import { test, expect } from "./fixtures";

/** The language switch is a radio group: the choice is kept on the device, so the arrow keys may choose. */

test("the arrow keys choose a language, and one is always on", async ({ page }) => {
  await page.goto("");
  const ro = page.getByRole("radio", { name: "ro", exact: true });
  const en = page.getByRole("radio", { name: "en", exact: true });
  await expect(en).toBeChecked();
  await expect(ro).not.toBeChecked();

  await en.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(ro).toBeChecked();
  await expect(en).not.toBeChecked();
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem("civicmap-lang"))).toBe("ro");

  // Choosing the one already on changes nothing: exactly one stays on.
  await ro.click();
  await expect(ro).toBeChecked();
});
