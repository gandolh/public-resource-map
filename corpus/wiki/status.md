# Status

_Last updated: 2026-07-02_

## 🟢 Development underway — Wave 1 shipped

Execution against the backlog is underway (branch `build/backlog`, uncommitted). **Done + verified: 07 (schema) · 11 (Vitest harness) · 02 (auth & admin gate) · 03 (places & OSM sync).** Data model, test machinery, auth foundation, and the places/OSM layer are in place. Remaining unknowns are empirical only (per-publisher source landscape; threshold tuning) — they resolve during the relevant briefs. Build order (from [index](../index.md)): 07 → 11 → 02 → 03 → **08 (next)** → 04 → 16 → 05 → 06 → 13 → 15 → 14 → 17 → 09 → 10.

## Where things stand

**The foundation is now the NEW model.** The 2026-06-28 grilling + research sessions re-shaped the product (POC, place-centric, sparse events, in-app+email notifications) and produced the brief backlog (02–17). As of 2026-07-02 the schema + shared types are place-centric and a Vitest harness exists, so feature briefs (02–06) can now be built test-first. Still on the OLD model: the **UI surfaces** (3-route event-centric) and there is **no seed-RO/auth/ingestion/favorites logic yet** — those are the next waves.

## Code vs. decisions gap

Narrowing. Already migrated (Wave 1):
- ~~Schema: standalone `resource`/`event`~~ → **consolidated place-centric Drizzle schema (13 tables), shared types are `Place`/`Event`.**
- ~~No test runner~~ → **Vitest harness (unit + Fastify `.inject()` integration) + `it.todo` seams.**

Still old (upcoming briefs):
- Seed data still NYC (brief 08 replaces with RO); API route *paths* still `/api/resources`+`/api/events` (rename is brief 03).
- UI: `/map`, `/events`, `/resources/:id` — the 3-surface model brief 06 will refactor.
- No auth, no OSM/places sync, no ingestion, no favorites/notifications logic yet.

See [decisions.md](decisions.md) for the target; briefs 02–12 for the path.

## Per-area snapshot

| Area | State |
|---|---|
| npm workspaces | done — shared/backend/ui wired |
| shared types | **done (new shape) — `Place`/`Event`, two category enums (brief 07)** |
| backend API | done — event-centric route *paths* still `/api/resources`+`/api/events` but now on the `place`/`event` tables (rename → brief 03); NYC seed |
| UI (3 routes) | done (old model) — to be refactored place-centric (brief 06); imports rethreaded to `Place` types |
| Component library | done — Base UI primitives, CivicMap tokens |
| Dark mode | done — tokens in CSS vars + ThemeProvider |
| Schema consolidation (07) | **done — consolidated 13-table place-centric Drizzle schema + fresh migration** |
| Vitest harness (11) | **done — Vitest 4 (unit + Fastify `.inject()` integration), `test`/`test:watch`/`test:cov`, `it.todo` seams** |
| Auth (02) | **done — email+password (argon2id), opaque `prm_session` cookie, verify/reset (dev=console), `requireAuth`/`requireAdmin` guards, env seed-admin, real Navbar dropdown** |
| Places + OSM sync (03) | **done — admin `POST /api/admin/osm/sync` (Overpass, tag→PlaceCategory map, centroid, non-clobbering upsert), public `GET /api/places`(+`:id`), ODbL attribution on map** |
| RO seed data (08) | not started — still NYC |
| Event ingestion (04) | not started |
| Favorites + notifications (05) | not started |
| Place-centric UI (06) | not started |
| Attribution (09) | not started |
| Test plans (10) | stale — test the old UI |
| Platform optimization (12) | not started — DB PRAGMAs apply with 07 |
| Public UI interactions (13) | not started — place panel, filters, what's-on, city picker, states/a11y |
| Archived events page (14) | not started — /archive: citywide past + my saved, links to place |
| Draw-to-filter (15) | not started — freehand/polygon spatial filter (split from 13) |
| Admin shell & review UI (16) | not started — /admin, sources panel, review table (split from 13) |
| Playwright e2e harness (17) | not started — config, fixtures, seeded-DB determinism (split from 11) |
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
