# Status

_Last updated: 2026-06-26_

## Where things stand

All three routes are functional with seeded NYC data. The database is migrated and seeded (8 resources, 8 events). A full UI audit has been run — one bug fixed (Hours JSON rendering), two open findings filed. Stitch design screens integrated into corpus. Next focus: wire location-aware defaults so events/map work without native geolocation, and fix the two open findings.

## Per-area snapshot

| Area | State |
|---|---|
| npm workspaces | done — shared/backend/ui wired |
| shared types | done — Resource, Event, common types, ESM build |
| backend API | done — routes live; migration run; 8 resources + 8 events seeded |
| UI `/map` | done — Leaflet map, CartoDB tiles, filter chips, radius slider, detail drawer |
| UI `/events` | done — grid, category chips, empty state, pagination |
| UI `/resources/:id` | done — hero, contact sidebar, hours, embedded map, not-found state |
| Component library | done — Base UI primitives, CivicMap tokens, all components |
| Navbar | done — CivicMap branding, active link state, theme toggle, profile menu |
| Dark mode | tokens in CSS vars + `.dark` class; ThemeProvider wired |
| Data ingestion | seeded — 8 NYC resources, 8 events via `db:seed` script |
| Backend auth | not started |
| Deployment | Docker for UI only; backend has no Dockerfile |

## Dev commands

```bash
# from repo root
npm install
npm run build -w shared       # must build first
npm run db:migrate -w backend # first time only
npm run dev                   # starts both backend (3001) and ui (5173)
```
