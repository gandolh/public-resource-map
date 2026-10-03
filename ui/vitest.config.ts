import { fileURLToPath } from "node:url";
import { defineProject } from "vitest/config";

/**
 * Pure logic under `app/lib`, in node. Component tests are still the deferred
 * seam in `vitest.workspace.ts`; this project only runs `*.test.ts`.
 */
export default defineProject({
  resolve: {
    alias: { "~": fileURLToPath(new URL("./app", import.meta.url)) },
  },
  test: {
    name: "ui",
    environment: "node",
    include: ["app/**/*.test.ts"],
  },
});
