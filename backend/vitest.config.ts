import { defineProject } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineProject({
  resolve: {
    alias: {
      // Resolve the shared package to its TS source so tests are green from a
      // clean checkout (shared/dist is gitignored / not built in CI-less flow).
      // Vite transforms the `.ts` source and resolves the `.js`-suffixed ESM
      // imports within it to their `.ts` files automatically.
      "@public-resource-map/shared": fileURLToPath(
        new URL("../shared/src/index.ts", import.meta.url),
      ),
    },
  },
  test: {
    name: "backend",
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
