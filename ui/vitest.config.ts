import { fileURLToPath } from "node:url";
import { defineProject } from "vitest/config";

/**
 * Pure logic under `app/lib`, in node. A wrapper that holds logic (the Dialog)
 * has one jsdom test, set per file with `// @vitest-environment jsdom`; flows
 * stay in Playwright.
 */
export default defineProject({
  resolve: {
    alias: { "~": fileURLToPath(new URL("./app", import.meta.url)) },
  },
  test: {
    name: "ui",
    environment: "node",
    include: ["app/**/*.test.{ts,tsx}"],
  },
});
