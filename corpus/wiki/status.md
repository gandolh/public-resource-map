# Status

_Last updated: 2026-06-28_

## Where things stand

**Planning, not yet building the reframe.** The 2026-06-28 grilling + research sessions re-shaped the product (POC, place-centric, sparse events, in-app+email notifications) and produced a full brief backlog (02–12). **The running code still reflects the OLD event-centric NYC-seed model** — none of the new decisions are implemented yet. The next phase is execution against the briefs, starting with schema consolidation (07) + the test harness (11).

## Code vs. decisions gap

The committed app predates the reframe. Concretely still old:
- Schema: standalone `resource`/`event` (event-centric), NYC seed.
- UI: `/map` (resource markers), standalone `/events`, `/resources/:id` — the 3-surface model brief 06 will refactor.
- No auth, no places model, no ingestion, no favorites/notifications, no test runner.

See [decisions.md](decisions.md) for the target; briefs 02–12 for the path.

## Per-area snapshot

| Area | State |
|---|---|
| npm workspaces | done — shared/backend/ui wired |
| shared types | done (old shape) — `Resource`/`Event`; brief 07 reshapes to `Place` |
| backend API | done (old shape) — event-centric routes; NYC seed |
| UI (3 routes) | done (old model) — to be refactored place-centric (brief 06) |
| Component library | done — Base UI primitives, CivicMap tokens |
| Dark mode | done — tokens in CSS vars + ThemeProvider |
| Schema consolidation (07) | **not started — build first** |
| Test harness (11) | **not started — no runner/config exists** |
| Auth (02) | not started |
| Places + OSM sync (03) | not started |
| RO seed data (08) | not started — still NYC |
| Event ingestion (04) | not started |
| Favorites + notifications (05) | not started |
| Place-centric UI (06) | not started |
| Attribution (09) | not started |
| Test plans (10) | stale — test the old UI |
| Platform optimization (12) | not started — DB PRAGMAs apply with 07 |
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
# tests: none yet — brief 11 adds vitest + @playwright/test
```
