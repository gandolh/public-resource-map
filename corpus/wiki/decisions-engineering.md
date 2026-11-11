---
summary: Locked stack (npm workspaces, React Router 8, pinned versions…) and code conventions — check before changing tooling or style.
updated: 2026-11-11
---

# Decisions — stack and code conventions

Split out of [decisions.md](decisions.md) on 2026-10-04, when that page passed ~200 lines. Unchanged in the move.

## Stack

- **npm workspaces** (not pnpm/yarn) — `workspace:*` protocol not supported; use `"*"` for local package refs.
- **React Router 8** (not v7) — latest stable as of 2026-06-26; requires Vite 7+.
- **Vite 7** (not Vite 8 beta) — stable build tool for React Router 8.
- **Tailwind CSS 4** — Vite plugin approach (`@tailwindcss/vite`), not PostCSS.
- **Fastify 5** (not Express) — chosen for performance and TypeScript-first plugin system.
- **better-sqlite3** (not `node:sqlite` or `libsql`) — synchronous, battle-tested, native addon; fits single-server deployment.
- **Drizzle ORM** (not Prisma) — lightweight, SQL-close, no separate runtime process.
- **Zod** for validation — schemas live in `shared/` and TS types are derived via `z.infer`; backend imports them so shape + validation have one source of truth.
- **TanStack Query** for all UI→backend reads — replaces hand-rolled `useEffect`+fetch; provider in `Layout.tsx`, client in `ui/app/lib/queryClient.ts`.
- **Zustand** for UI state — `locationStore` (geolocation requested once, shared across pages) and `mapFilterStore` (category/radius/search/selection).
- **SPA mode** for the UI (`ssr: false` in `react-router.config.ts`) — simplifies deployment; no server-side rendering needed for an interactive map app. Note: route modules must use `clientLoader`, not `loader` (a `loader` export fails the build in SPA mode).
- **SQLite** (not Postgres) — appropriate for single-server / local-first deployments at this scale.
- **Exact pinned dependency versions** (no `^` ranges) in every `package.json` — reproducible installs.

## Code conventions

- **Import extensions are package-specific** (corrected 2026-06-28 — the old "no `.js` suffixes anywhere" was wrong and would break the backend at runtime):
  - **`backend/` + `shared/`** run as **Node ESM** (`"type": "module"`, executed via `tsx`/`node dist`), so relative imports **MUST keep the `.js` suffix** (the existing code already does). Per research, code that runs directly in Node wants `moduleResolution: "nodenext"`, which *requires* the extension; the current `"bundler"` setting tolerates the suffix but is philosophically for bundled code — consider switching backend/shared to `nodenext` during the schema consolidation. **Do not strip `.js` from backend/shared imports.**
  - **`ui/`** is bundled by **Vite**, so imports are **extensionless** (current state). 
- **OKLCH color tokens** in CSS custom properties — future-proof color space, already in place via `app.css`.
- **`cn()` utility** (`clsx` + `tailwind-merge`) as the canonical class-building function.
- **UI primitives: `@base-ui/react`** (Button, Avatar, Menu, Toggle, Slider, Input) + lucide-react icons. _(History: the original Stitch brief said shadcn/ui new-york; it was replaced by `@base-ui/react` when the design was implemented — see log 2026-06-26.)_

## The house style, formatted and checked (2026-11-11)

The repo adopted the estate's quality harness. `npm run check` (typecheck, lint, format check, conventions, unit tests) holds for a human, any agent and the owner's hand-backs; `npm run check:fast` is its typecheck plus ESLint on the changed files, and the plugin's Stop hook runs it.

- **Where the configs come from.** `vendor/house-style/` is a generated copy (version and source commit in its README), refreshed by `npm run house-style:sync`. Not a dependency: npm locks a GitHub dependency as a git URL, and the image's `deps` stage has no `git`. `eslint.config.mjs`, `prettier.config.mjs`, `knip.config.js` and `.dependency-cruiser.cjs` extend it. The tools are pinned exactly in the root `package.json`, and `.npmrc` holds `save-exact=true`.
- **Width 120.** The estate's one width, and this repo's least churn (95 files, 1,040 added and 964 removed lines on the TypeScript at 120; 100 was 2,131 and 761, 150 was 820 and 1,474). The reformat is one commit; its hash is in `.git-blame-ignore-revs`. An esbuild bundle compare of every file before and after found no difference.
- **What Prettier skips** (`.prettierignore`): Markdown (the corpus is prose its own lint governs); `*.css` (`ui/app/app.css` would change 391 of 461 lines, and its aligned token tables are its own style; it can join once it is split into layers); `backend/drizzle/` and `backend/src/db/fixtures/` (generated or frozen: the OSM capture alone is 36,743 lines); the vendored Ward and house-style copies; the lockfile and build output; and the `docs/` workspace.
- **tsconfig.** `tsconfig.base.json` carries the house flags itself instead of extending the vendored base: the image's builder stage copies only that one file, and the vendored base turns on `noUncheckedIndexedAccess`, which this repo cannot take yet (94 errors: 84 in `backend`, 52 of them in tests, and 10 in `ui`). With the flag off, `@typescript-eslint/no-unnecessary-type-assertion` is off too, because it calls every `!` on an indexed read unnecessary and its autofix strips them; both come back together. `NodeNext` for `shared` and `backend`, `bundler` for `ui`, and `e2e/` has its own tsconfig so the typecheck and typed lint cover it. TypeScript is 6.0.3 in every workspace (`baseUrl` went from `ui/tsconfig.json`; its `paths` resolve from the file).
- **The 58 awaits.** Drizzle's better-sqlite3 driver answers synchronously, so `await db...all()` awaited a plain array. `@typescript-eslint/await-thenable` found 70 (58 in `backend/src`, 12 in tests) and they were deleted. A query builder with no `.all()`, `.get()` or `.run()` is a thenable and still needs its `await`.
- **The checks that wait.** `check-base-ui` and `check-structure` run `--warn-only` until the Base UI and server work clear their findings; `n/no-process-env` is a warning on `backend/src` until the server reads its settings from one `config.ts`. dependency-cruiser runs strict from the start and found nothing.
- **Rejected:** a git dependency on the house configs (no `git` in the image); `exactOptionalPropertyTypes` (30 and 8 errors, counted for later); Prettier on Markdown and on `app.css`; ESLint `project` instead of `projectService` (29.5 s against 19.5 s).
