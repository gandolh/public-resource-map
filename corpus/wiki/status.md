# Status

_Last updated: 2026-06-26_

## Where things stand

The full CivicMap UI design (from Stitch brief 01) has been implemented and verified. All three routes render with the navbar, CivicMap token design system, and Base UI components. The backend is scaffolded but the database has not been migrated or seeded — all data-dependent UI shows empty states. Next focus is a UI audit followed by seeding data and wiring the backend.

## Per-area snapshot

| Area | State |
|---|---|
| npm workspaces | done — shared/backend/ui wired |
| shared types | done — Resource, Event, common types, ESM build |
| backend API | scaffolded — routes + Drizzle schema written; migration not run |
| UI `/map` | done — Leaflet map, CartoDB tiles, filter chips, radius slider, detail drawer |
| UI `/events` | done — grid, category chips, empty state, pagination |
| UI `/resources/:id` | done — hero, contact sidebar, hours, embedded map, not-found state |
| Component library | done — Base UI primitives, CivicMap tokens, all components |
| Navbar | done — CivicMap branding, active link state, theme toggle, profile menu |
| Dark mode | tokens in CSS vars + `.dark` class; ThemeProvider wired |
| Data ingestion | not started |
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
