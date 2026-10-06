---
summary: Locked stack (npm workspaces, React Router 8, pinned versions…) and code conventions — check before changing tooling or style.
updated: 2026-10-04
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
  - **`backend/` + `shared/`** run as **Node ESM** (`"type": "module"`, executed via `tsx`/`node dist`), so relative imports **MUST keep the `.js` suffix** (the existing code already does). Per research, code that runs directly in Node wants `moduleResolution: "nodenext"`, which *requires* the extension; the current `"bundler"` setting tolerates the suffix but is philosophically for bundled code — consider switching backend/shared to `nodenext` during brief 07. **Do not strip `.js` from backend/shared imports.**
  - **`ui/`** is bundled by **Vite**, so imports are **extensionless** (current state). 
- **OKLCH color tokens** in CSS custom properties — future-proof color space, already in place via `app.css`.
- **`cn()` utility** (`clsx` + `tailwind-merge`) as the canonical class-building function.
- **UI primitives: `@base-ui/react`** (Button, Avatar, Menu, Toggle, Slider, Input) + lucide-react icons. _(History: the original Stitch brief said shadcn/ui new-york; it was replaced by `@base-ui/react` during brief 01 implementation — see log 2026-06-26.)_
