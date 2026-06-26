# Decisions

Locked tech and design choices. Don't relitigate without an explicit revisit + log entry.

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

## Known/accepted issues

- **`npm audit`: 4 moderate (esbuild GHSA-67mh-4wv8-2f99).** Sole source is `drizzle-kit`'s transitive `@esbuild-kit/core-utils → esbuild@~0.18.20`. Accepted, not fixed: (1) dev-tooling only — `drizzle-kit` never ships to production and isn't used by any npm script (migrations run via `drizzle-orm`'s migrator through `tsx`; drizzle-kit is only for manual `generate`); (2) the advisory requires running esbuild's dev server, which `drizzle-kit generate` does not; (3) `0.31.10` is the latest stable and still pins the vulnerable esbuild — only `1.0.0-beta`/`rc` drop it; (4) an `esbuild` override won't apply because `@esbuild-kit/core-utils` uses the incompatible 0.18 platform-package layout. `npm audit fix --force` would *downgrade* drizzle-kit to 0.18.1 — do not run it.

## Code conventions

- **No `.js` extension suffixes in source imports** — bundler moduleResolution handles it.
- **OKLCH color tokens** in CSS custom properties — future-proof color space, already in place via `app.css`.
- **`cn()` utility** (`clsx` + `tailwind-merge`) as the canonical class-building function.
- **shadcn/ui new-york style** — component library choice; Radix UI primitives, lucide icons.

## Data model

- **Bounding-box proximity** for spatial queries (not Haversine, not PostGIS) — acceptable approximation for city-scale; revisit if performance degrades at scale.
- **ISO 8601 strings** for all dates in the DB (SQLite has no native date type).
- **`randomUUID()`** (Node built-in) for IDs — no external UUID library.
