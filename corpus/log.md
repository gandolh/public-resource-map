# Log

## [2026-06-26] done | UI audit run — 1 bug fixed, 2 findings filed

Ran TP-01 through TP-04 against seeded data. Fixed raw JSON rendering in resource
detail Hours section (`HoursDisplay` component in `resources.$id.tsx`). Filed F-01
(map chip overflow on mobile) and a minor title-tag observation as corpus todos.
Full results in `test-plans/RESULTS.md`.

## [2026-06-26] done | Seed script added; 8 resources + 8 events loaded (NYC)

Added `backend/src/db/seed.ts` and `db:seed` npm script. Seeded 8 resources and
8 events around New York City (Central Park area). Migration confirmed clean.

## [2026-06-26] done | Stitch screens integrated into corpus; stitch_output removed

Extracted structural patterns from all 4 Stitch HTML screens into `wiki/stitch-screens.md`. Moved brief 01 to `briefs/done/`. Deleted `stitch_output/` directory and `stitch_civic_mapper.zip` from repo root. Updated `index.md` accordingly.

## [2026-06-26] todo | Brief 01 — Stitch design brief filed

Filed `briefs/todo/01-stitch-design-brief.md` — a full design brief for Stitch (or any design tool) covering the map home screen, detail drawer, events list, map pins, and color/token system. Covers implemented vs. to-do scope and design constraints (responsive, dark mode, WCAG AA, Tailwind/Radix stack).

## [2026-06-26] done | Brief 01 — CivicMap design implementation shipped

Implemented the full Stitch CivicMap design system. Key deliverables:
- Replaced shadcn/ui with `@base-ui/react` (Button, Avatar, Menu, Toggle, Slider, Input)
- Added `react-leaflet` + CartoDB Positron/DarkMatter tiles
- CSS custom property token system + `@theme inline` Tailwind v4 bridge
- Component library: CategoryBadge, FilterChip, EventCard, MapPin, DetailDrawer, SearchInput, Pagination, RadiusSlider
- Rebuilt Navbar with CivicMap branding and lucide icons
- Wired all 3 routes: `/map` (Leaflet + filter overlay), `/events` (grid + filter chips), `/resources/:id` (detail page)
- Home (`/`) redirects to `/map`
- Fixed `Layout.tsx` default export (was causing navbar to not render)
- Fixed `ResourceMarkers.tsx` — removed `react-dom/server` import breaking SPA mode
- Typecheck passes clean; all routes render correctly verified with Playwright

## [2026-06-26] maintenance | Bootstrap monorepo + corpus

Restructured project as npm workspaces (`shared`, `backend`, `ui`). Updated all packages to latest stable (React 19.2.7, React Router 8.0.1, Vite 7.3.6, Fastify 5.8.5, Tailwind 4.3.1, TypeScript 5.8.5, Drizzle 0.45.2). Created Fastify + SQLite backend with Drizzle ORM and Zod validation; generated initial migration. All three packages compile and type-check cleanly. Seeded corpus wiki (overview, architecture, decisions, status, open-questions).
