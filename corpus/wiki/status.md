# Status

_Last updated: 2026-09-04_

## 🟢 The UI is now the new model

The public surface has been rebuilt place-centric on a replacement design system (2026-09-04). **Done + verified: 07 (schema) · 11 (Vitest harness) · 02 (auth & admin gate) · 03 (places & OSM sync) · most of 06 + 13 (place-centric UI & public interactions) · the seed half of 08.** The map is home, the pin is a place, events live inside a place, and a citywide what's-on index shares one filter model with the map.

Remaining build order: **04 (event ingestion — the biggest gap, every event in the app is currently synthetic)** → 05 (favorites + notifications) → 16 (admin shell) → 15 (draw-to-filter) → 14 (archive) → 17 (Playwright) → 09 (attribution page) → 10 (test plans rewrite) → 12 (platform optimization).

## Where things stand

**The old design system is gone, and so is the event-centric UI.** The 2026-06-29 "Warmer Editorial-Civic" world (Fraunces + steel-blue Material tokens) was retired without ever being built; the user asked for a total UI/UX rework, chose the category convention played straight at a Citymapper/Linear craft bar, and that is now locked ([decisions.md → Visual direction](decisions.md)).

What actually exists to look at: a full-bleed map of Timișoara or București with clustered category pins that badge their upcoming-event count, a place panel (desktop) / draggable sheet (mobile) showing what is on at that place grouped Today / Tomorrow / This weekend / Later, a citywide what's-on index, category chips + a timing lens that hard-filters, Romanian by default with an English switch, and both themes.

**The honest gap: there is still no event ingestion.** Every event in the app is seeded and synthetic (labelled as such in `backend/src/db/seed.ts`). The places are real Romanian institutions but hand-seeded rather than OSM-synced. Brief 04 is what makes this a product rather than a demo.

## Code vs. decisions gap

Mostly closed on the public surface. Already migrated:
- ~~Schema: standalone `resource`/`event`~~ → **consolidated place-centric Drizzle schema.**
- ~~No test runner~~ → **Vitest harness (unit + Fastify `.inject()`), 68 passing.**
- ~~UI: `/map`, `/events`, `/resources/:id`~~ → **`/` (map is home), `/places/:id` nested under it, `/whats-on`; old URLs redirect.**
- ~~NYC seed~~ → **Timișoara + București seed (38 real places, 14 synthetic events).**
- ~~No place-events or citywide endpoint~~ → **`upcomingEventCount` on `/api/places`, `/api/places/:id/events`, `/api/whats-on`.**

Still open:
- **No event ingestion (brief 04)** — the one that matters.
- **No favorites, no notification bell (brief 05)** — deliberately left out of the rebuild rather than shipped as dead controls.
- No `/verify` or `/reset` UI routes yet (the backend flows exist).
- Places are seeded, not OSM-synced; run `POST /api/admin/osm/sync` for real coverage.
- **CARTO now requires an API key** — the app falls back to filtered OSM tiles until `VITE_CARTO_API_KEY` is set (see [decisions.md → Basemap constraint](decisions.md)).

## Per-area snapshot

| Area | State |
|---|---|
| npm workspaces | done — shared/backend/ui wired |
| shared types | **done (new shape) — `Place`/`Event`, two category enums (brief 07)** |
| backend API | done — event-centric route *paths* still `/api/resources`+`/api/events` but now on the `place`/`event` tables (rename → brief 03); NYC seed |
| UI routes | **done (new model) — `/` map home, `/places/:id` panel-over-map, `/whats-on`, `/login`, `/register`; legacy URLs redirect** |
| Component library | **rebuilt — new token layer (`ui/app/app.css`), Button/Chip/Segmented/SearchInput/Skeleton/StateBlock/CategoryBadge, map pins + clusters, place panel/sheet, filter bar** |
| Dark mode | **done — both themes designed, not inverted; light/dark/system** |
| Schema consolidation (07) | **done — consolidated 13-table place-centric Drizzle schema + fresh migration** |
| Vitest harness (11) | **done — Vitest 4 (unit + Fastify `.inject()` integration), `test`/`test:watch`/`test:cov`, `it.todo` seams** |
| Auth (02) | **done — email+password (argon2id), opaque `prm_session` cookie, verify/reset (dev=console), `requireAuth`/`requireAdmin` guards, env seed-admin, real Navbar dropdown** |
| Places + OSM sync (03) | **done — admin `POST /api/admin/osm/sync` (Overpass, tag→PlaceCategory map, centroid, non-clobbering upsert), public `GET /api/places`(+`:id`), ODbL attribution on map** |
| RO seed data (08) | **partial — 38 real Timișoara/București places + 14 synthetic events seeded; OSM sync still the real path** |
| Event ingestion (04) | not started |
| Favorites + notifications (05) | not started |
| Place-centric UI (06) | **mostly done — pins/panel/what's-on/city picker shipped; favorite star + notification bell wait on brief 05** |
| Attribution (09) | not started |
| Test plans (10) | stale — they describe a UI that no longer exists |
| Platform optimization (12) | not started — DB PRAGMAs apply with 07 |
| Public UI interactions (13) | **mostly done — grouped events, clustering, hard-filtering lens, guided zero-results, loading/empty/error, focus management; see the brief for the precise remainder** |
| Archived events page (14) | not started — /archive: citywide past + my saved, links to place |
| Draw-to-filter (15) | not started — freehand/polygon spatial filter (split from 13) |
| Admin shell & review UI (16) | not started — /admin, sources panel, review table (split from 13) |
| Playwright e2e harness (17) | not started — config, fixtures, seeded-DB determinism (split from 11) |
| i18n | **done — RO default + EN switch, `Intl.PluralRules`/`DateTimeFormat`, no framework** |
| Deployment | decision locked; no brief yet; backend has no deploy setup |

## Dev commands

```bash
# from repo root
npm install
npm run build -w shared       # must build first
npm run db:migrate -w backend # first time only
npm run db:seed -w backend    # currently NYC data (brief 08 replaces with RO)
npm run dev                   # backend (3001) + ui (5173)
npm run typecheck             # all workspaces
npm test                      # Vitest (backend + shared): unit + Fastify .inject() integration
npm run test:watch            # TDD inner loop
npm run test:cov              # coverage (reported, not gated)
# e2e (@playwright/test) still to come — brief 17
```
