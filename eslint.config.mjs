import { houseStyle } from "./vendor/house-style/eslint.config.js";

/**
 * The house config from the vendored house-style copy, given this repo's folders. Thin on purpose: the
 * compiler is the first gate, and the house adds only what it cannot see. The rules and the reason for
 * each are in the copy.
 */
export default [
  ...houseStyle({
    root: import.meta.dirname,
    web: "ui/app",
    server: "backend/src",
    // vitest's rules belong to the unit tests only; the Playwright specs in e2e/ get their own block below.
    tests: ["backend/src/**/*.test.ts", "shared/src/**/*.test.ts", "ui/app/**/*.test.{ts,tsx}"],
    // React Router reads these modules through `default`.
    defaultExports: ["ui/app/root.tsx", "ui/app/routes.ts", "ui/app/components/Layout.tsx", "ui/app/routes/**"],
    // Allowed to print: the database CLIs talk to the person running them, and the entry logs before the
    // logger exists.
    console: [
      "backend/src/db/capture-osm.ts",
      "backend/src/db/migrate.ts",
      "backend/src/db/seed.ts",
      "backend/src/db/seed-users.ts",
      "backend/src/db/set-role.ts",
      "backend/src/index.ts",
    ],
    // The e2e project and the root's tool configs sit outside the workspaces' tsconfigs where the service
    // can't find one.
    typed: { allowDefaultProject: ["playwright.config.ts", "vitest.config.ts", "vitest.workspace.ts"] },
    ignores: ["docs/**", "ui/build/**", "ui/.react-router/**", "e2e/.data/**", "playwright-report/**"],
  }),
  {
    // A warning for now (2026-11-11): these files still read the environment themselves. When the server
    // takes its settings from config.ts, this block goes and the rule is an error again.
    name: "prm/process-env-warns",
    files: ["backend/src/**/*.ts"],
    ignores: ["backend/src/**/*.test.ts"],
    rules: { "n/no-process-env": "warn" },
  },
  {
    // The Playwright specs: a `!` is a warning as in the unit tests, and they set the environment up.
    name: "prm/e2e",
    files: ["e2e/**/*.ts"],
    rules: { "@typescript-eslint/no-non-null-assertion": "warn", "n/no-process-env": "off" },
  },
  {
    // Off for now (2026-11-11): without noUncheckedIndexedAccess this rule flags every `!` on an indexed
    // read, and its autofix strips them. It comes back with the flag.
    name: "prm/no-unnecessary-type-assertion-off",
    files: ["**/*.{ts,tsx}"],
    rules: { "@typescript-eslint/no-unnecessary-type-assertion": "off" },
  },
];
