/**
 * Vitest projects for this monorepo (backend + shared).
 *
 * NOTE: Vitest 4 removed auto-discovery of the standalone `vitest.workspace.ts`
 * file (and the `test.workspace` option) in favour of `test.projects`. We keep
 * the project list in this file — the canonical "workspace" definition — and
 * `vitest.config.ts` imports it into `test.projects`. Add a new package here
 * (point at its own `vitest.config.ts`) to fold it into `npm test`.
 *
 * SEAM: the `ui/` component-test project (`@testing-library/react`) is
 * intentionally deferred — when it lands, add `"./ui/vitest.config.ts"` below.
 */
export const projects = [
  "./backend/vitest.config.ts",
  "./shared/vitest.config.ts",
];
