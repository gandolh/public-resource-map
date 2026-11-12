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
    // The stylesheet Tailwind reads: the correctness rules and the class order are errors.
    tailwind: { css: "ui/app/app.css", order: true },
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
      "backend/src/server.ts",
      "scripts/generate-data-sources.ts",
    ],
    // The e2e project and the root's tool configs sit outside the workspaces' tsconfigs where the service
    // can't find one.
    typed: {
      allowDefaultProject: [
        "playwright.config.ts",
        "vitest.config.ts",
        "vitest.workspace.ts",
        "scripts/generate-data-sources.ts",
      ],
    },
    ignores: ["docs/**", "ui/build/**", "ui/.react-router/**", "e2e/.data/**", "playwright-report/**"],
  }),
  {
    // Marker classes: no utility, only a hook for a rule in app.css (the map wrapper's state, and the
    // standard-tile fallback). Naming them here keeps the unknown-class check honest for everything else.
    name: "prm/tailwind-marker-classes",
    files: ["ui/app/**/*.{ts,tsx}"],
    rules: {
      "better-tailwindcss/no-unknown-classes": [
        "error",
        { ignore: ["has-selection", "sheet-peek", "sheet-full", "map-fallback"] },
      ],
    },
  },
  {
    // Off for now (2026-11-11): without noUncheckedIndexedAccess this rule flags every `!` on an indexed
    // read, and its autofix strips them. It comes back with the flag.
    name: "prm/no-unnecessary-type-assertion-off",
    files: ["**/*.{ts,tsx}"],
    rules: { "@typescript-eslint/no-unnecessary-type-assertion": "off" },
  },
];
