---
summary: Locked stack (npm workspaces, React Router 8, pinned versions…) and code conventions — check before changing tooling or style.
updated: 2026-11-12
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
- **UI primitives: `@base-ui/react`**, used only through the wrappers in `ui/app/components/ui/` (Menu, Popover, Dialog, Drawer, Toast, Tabs, RadioGroup, Toggle, Checkbox, Select) + lucide-react icons; the rules are the base-ui skill's, checked by `check-base-ui` (see [decisions-ui.md](decisions-ui.md)). _(History: the original Stitch brief said shadcn/ui new-york; it was replaced by `@base-ui/react` when the design was implemented — see log 2026-06-26.)_

## The house style, formatted and checked (2026-11-11)

The repo adopted the estate's quality harness. `npm run check` (typecheck, lint, format check, conventions, unit tests) holds for a human, any agent and the owner's hand-backs; `npm run check:fast` is its typecheck plus ESLint on the changed files, and the plugin's Stop hook runs it.

- **Where the configs come from.** `vendor/house-style/` is a generated copy (version and source commit in its README), refreshed by `npm run house-style:sync`. Not a dependency: npm locks a GitHub dependency as a git URL, and the image's `deps` stage has no `git`. `eslint.config.mjs`, `prettier.config.mjs`, `knip.config.js` and `.dependency-cruiser.cjs` extend it. The tools are pinned exactly in the root `package.json`, and `.npmrc` holds `save-exact=true`.
- **Width 120.** The estate's one width, and this repo's least churn (95 files, 1,040 added and 964 removed lines on the TypeScript at 120; 100 was 2,131 and 761, 150 was 820 and 1,474). The reformat is one commit; its hash is in `.git-blame-ignore-revs`. An esbuild bundle compare of every file before and after found no difference.
- **What Prettier skips** (`.prettierignore`): Markdown (the corpus is prose its own lint governs); `*.css` (`ui/app/app.css` would change 391 of 461 lines, and its aligned token tables are its own style; it can join once it is split into layers); `backend/drizzle/` and `backend/src/db/fixtures/` (generated or frozen: the OSM capture alone is 36,743 lines); the vendored Ward and house-style copies; the lockfile and build output; and the `docs/` workspace.
- **tsconfig.** `tsconfig.base.json` carries the house flags itself instead of extending the vendored base: the image's builder stage copies only that one file, and the vendored base turns on `noUncheckedIndexedAccess`, which this repo cannot take yet (94 errors: 84 in `backend`, 52 of them in tests, and 10 in `ui`). With the flag off, `@typescript-eslint/no-unnecessary-type-assertion` is off too, because it calls every `!` on an indexed read unnecessary and its autofix strips them; both come back together. `NodeNext` for `shared` and `backend`, `bundler` for `ui`, and `e2e/` has its own tsconfig so the typecheck and typed lint cover it. TypeScript is 6.0.3 in every workspace (`baseUrl` went from `ui/tsconfig.json`; its `paths` resolve from the file).
- **The 58 awaits.** Drizzle's better-sqlite3 driver answers synchronously, so `await db...all()` awaited a plain array. `@typescript-eslint/await-thenable` found 70 (58 in `backend/src`, 12 in tests) and they were deleted. A query builder with no `.all()`, `.get()` or `.run()` is a thenable and still needs its `await`.
- **The checks that waited.** `check-base-ui` and `check-structure` ran `--warn-only` until the Base UI and server work cleared their findings, and `n/no-process-env` was a warning on `backend/src` until the server read its settings from one `config.ts`; `check-base-ui` went strict with the Base UI work, and the other two with the server work on 2026-11-12. dependency-cruiser ran strict from the start.
- **Rejected:** a git dependency on the house configs (no `git` in the image); `exactOptionalPropertyTypes` (30 and 8 errors, counted for later); Prettier on Markdown and on `app.css`; ESLint `project` instead of `projectService` (29.5 s against 19.5 s).

## The server in the house code structure (2026-11-12)

The API follows the estate's `code-structure` skill. `config.ts` is the one reader of the environment, `server.ts` runs the process, `app.ts` builds the app without listening, and the code splits by feature (`features/<name>/` with an `index.ts`) instead of by layer. Every route declares its schemas through `@fastify/type-provider-zod`, a response included, and one error plugin answers every error in the repo's `{ code, message }`.

- **The directory stays `backend/`,** not the skill's `server/`. A rename would touch the Dockerfile's `COPY` lines, the compose volume, the `prm-migrate` entrypoint, the workspace name and the vitest projects, for no gain. `scripts/conventions.json` names the roots for the checkers.
- **`NODE_ENV` is read once, as `config.production`.** The legal posture keeps an adapter that has not cleared it (the iaBilet rule) off production, and the image sets `NODE_ENV=production`. A purpose-named variable would leave the safeguard off wherever a deploy forgot it. This is the one `check-structure` exception. Since 2026-11-12 the rule reads the source registry: a `forbidden` source refreshes in development only.
- **`PUBLIC_ORIGIN` is required everywhere.** It used to be required only in production. The database and seed scripts read smaller sets and don't need it. There is no `.env` loader in code: the dev scripts pass the root `.env` to Node, so a missing variable fails the parse, naming it.
- **`AUTH_TRUSTED_PROXIES` is the one proxy list.** It sets Fastify's `trustProxy` and the library's login lockout.
- **Timeouts:**
  - `connectionTimeout` and `requestTimeout` are 180 s. The OSM sync waits up to 100 s on Overpass.
  - The two ingest refreshes lift the socket timeout for themselves, because sources run one after another at the geocoder's pace.
  - `keepAliveTimeout` is 125 s, above Caddy's 2-minute idle upstream.
- **The admin guard runs in `preValidation`,** not `preHandler`. Fastify validates between the two, so a signed-in non-admin still gets 403 before any 400 describing an admin route's input.
- **Typed plugin options, no decorators.** `buildApp` builds an `AppContext` (settings, database, mail sweeper, ingest and OSM dependencies) and registers each feature with it. Each feature names what it takes in its own `Options` type, so no feature imports `app.ts`, which would close a cycle that dependency-cruiser counts. Tests replace parts through `buildTestApp`'s options.
- **Server-only response schemas live in their feature** (`features/ingest/schemas.ts`). Each is typed against the shared DTO the UI reads, so the two can't drift. The schemas the UI imports stay in `shared/`.
- **Rejected:**
  - renaming `backend/` to `server/`;
  - `@fastify/autoload`, because registration by name is greppable and keeps the option types;
  - TypeBox, because zod is already the contract in `shared/`;
  - extracting a `store.ts` per feature now: the handlers keep their Drizzle queries, so the layout, the schemas and the error handling don't land in one diff with a fourth change.

## Known/accepted issues (moved from decisions.md 2026-11-12)

- **`npm audit`: 4 moderate (esbuild GHSA-67mh-4wv8-2f99).** Sole source is `drizzle-kit`'s transitive `@esbuild-kit/core-utils → esbuild@~0.18.20`. Accepted, not fixed: (1) dev-tooling only — `drizzle-kit` never ships to production and isn't used by any npm script (migrations run via `drizzle-orm`'s migrator through `tsx`; drizzle-kit is only for manual `generate`); (2) the advisory requires running esbuild's dev server, which `drizzle-kit generate` does not; (3) `0.31.10` is the latest stable and still pins the vulnerable esbuild — only `1.0.0-beta`/`rc` drop it; (4) an `esbuild` override won't apply because `@esbuild-kit/core-utils` uses the incompatible 0.18 platform-package layout. `npm audit fix --force` would *downgrade* drizzle-kit to 0.18.1 — do not run it.
