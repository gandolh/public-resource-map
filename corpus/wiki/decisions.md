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
- **Zod** for validation — consistent with the TypeScript-first stack.
- **SPA mode** for the UI (`ssr: false` in `react-router.config.ts`) — simplifies deployment; no server-side rendering needed for an interactive map app.
- **SQLite** (not Postgres) — appropriate for single-server / local-first deployments at this scale.

## Code conventions

- **No `.js` extension suffixes in source imports** — bundler moduleResolution handles it.
- **OKLCH color tokens** in CSS custom properties — future-proof color space, already in place via `app.css`.
- **`cn()` utility** (`clsx` + `tailwind-merge`) as the canonical class-building function.
- **shadcn/ui new-york style** — component library choice; Radix UI primitives, lucide icons.

## Data model

- **Bounding-box proximity** for spatial queries (not Haversine, not PostGIS) — acceptable approximation for city-scale; revisit if performance degrades at scale.
- **ISO 8601 strings** for all dates in the DB (SQLite has no native date type).
- **`randomUUID()`** (Node built-in) for IDs — no external UUID library.
