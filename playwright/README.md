# Playwright Hub — CivicMap

How to bring up the app, fixtures, routes, and conventions for UI testing.
Test plans live in [`../corpus/test-plans/`](../corpus/test-plans/index.md).

---

## Bring up the app

```bash
# 1. Install deps (from repo root)
npm install

# 2. Build shared types
npm run build -w shared

# 3. Migrate + seed the database
npm run db:migrate -w backend
npm run db:seed -w backend      # 8 resources + 8 events around NYC

# 4. Start both servers
npm run dev
# → backend on http://localhost:3001
# → ui     on http://localhost:5173
```

Wait until you see both:
```
✓ Listening on 0.0.0.0:3001
✓ [vite] Server running at http://localhost:5173
```

Verify backend health:
```
curl http://localhost:3001/health
```

---

## Routes

| URL | Screen |
|---|---|
| `http://localhost:5173/` | Redirects → `/map` |
| `http://localhost:5173/map` | Map page — Leaflet map, filter overlay, detail drawer |
| `http://localhost:5173/events` | Events list — card grid, category chips, pagination |
| `http://localhost:5173/resources/:id` | Resource detail — hero, hours, map embed, contact |

---

## Fixtures

Seeded data is for **New York City (Central Park area)**. The app defaults to
`{ lat: 44.4268, lng: 26.1025 }` (Bucharest) when geolocation is unavailable.
To see seeded data on the map you must either:
- Allow geolocation and be near NYC, **or**
- Mock geolocation to NYC: see below.

### Seeded resources (8)

| Name | Category | Approx coordinates |
|---|---|---|
| Central Park Public Library | library | 40.7527, -73.9772 |
| Northside Community Center | community_center | 40.7965, -73.9638 |
| Riverside Park | park | 40.8010, -73.9724 |
| Upper West Side Health Clinic | healthcare | 40.7868, -73.9741 |
| Harlem Food Bank Distribution | food | 40.8087, -73.9493 |
| Columbia University Public Lectures | education | 40.8075, -73.9626 |
| Midtown Homeless Shelter | shelter | 40.7495, -73.9963 |
| Central Park Conservancy | park | 40.7851, -73.9683 |

### Seeded events (8)

| Title | Category | Price |
|---|---|---|
| Food Truck Friday | festival | Free |
| Outdoor Cinema: Classic Features | other | Free |
| Downtown Weekend Farmers Market | community | Free |
| City Jazz Festival — Main Stage | concert | $25 |
| Community Theater: Midsummer | theater | Free |
| Urban Sketching Workshop | workshop | $15 |
| 5K Run for Community Health | sport | $30 |
| Harlem Cultural Exhibition | exhibition | Free |

### Mock geolocation to NYC

In the browser console (or via Playwright `page.evaluate`):
```js
// Override geolocation to NYC Central Park
navigator.geolocation.getCurrentPosition = (cb) =>
  cb({ coords: { latitude: 40.7851, longitude: -73.9683, accuracy: 10 } });
```

Or via Playwright context:
```js
await context.setGeolocation({ latitude: 40.7851, longitude: -73.9683 });
await context.grantPermissions(["geolocation"]);
```

---

## Conventions

- **Screenshots**: `playwright/screenshots/<plan-id>-<step>.png`
  e.g. `TP-01-map-filter-chips.png`, `TP-02-events-empty-state.png`
- **Reset state**: re-run `npm run db:seed -w backend` (uses `onConflictDoNothing` — idempotent)
- **Known benign console noise**: Leaflet CSS warnings in dev mode; React Router HMR messages
- **No auth**: the app has no login screen in the current build
- **API base**: hardcoded to `http://localhost:3001` via `VITE_API_URL` env (default)

---

## Tear down

```bash
# Stop the dev servers with Ctrl+C
# No throwaway DB — the seeded data/app.db is gitignored anyway
# Clean up screenshots (gitignored, so safe to leave or delete)
rm playwright/screenshots/*.png 2>/dev/null || true
```
