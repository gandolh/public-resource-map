# Getting started

The full local setup. The [main README](../README.md) has the short version.

## Prerequisites

- Node 24 and npm. Tested with Node 24.14.1.
- The public map needs nothing else. SQLite runs inside the API process, and the seed works offline.
- Signing in, favourites, notifications and the admin need the local Ward container from the sibling `wzd_auth` repo, in `wzd_auth/infrastructure/local/`. Its README covers starting it.

## 1. Install and configure

From the repo root:

```bash
npm install
cp .env.example .env
```

`npm run dev` loads `.env` into both the API and the UI dev server. The deploy does not read it; vps-deploy passes its own values.

| Variable | Default in `.env.example` | Purpose |
|---|---|---|
| `WARD_PUBLIC_ORIGIN` | `http://localhost:8792` | The Ward the API trusts. The UI dev server also proxies `/ward` and `/ward-api` there. |
| `WARD_API_BASE_PATH` | `/ward-api` | Where Ward's API lives on that origin. |
| `WARD_APP_KEY` | `wak_replace_me` | prm's key at Ward. Ward's `seed.mjs` writes a working one. With the placeholder the public map works and sign-in does not. |
| `PRM_BASE` | `/prm/` | The path the app is served under, as in the deploy. |
| `VITE_API_URL` | `/prm-api` | Where the app calls the API. The dev server proxies it to the backend. |
| `VITE_CARTO_API_KEY` | unset | CARTO basemap tiles. Without a key the map uses OpenStreetMap tiles, toned down toward the same look; see `ui/app/lib/map.ts`. |
| `VITE_DATA_CONTACT` | placeholder address | The takedown contact shown on `/about-data`. |
| `NOMINATIM_USER_AGENT` | placeholder contact | Nominatim's policy wants an identifying User-Agent. Without it the pipeline geocodes nothing and unmatched venues wait for a manual pin. |

The API refuses to start unless all three `WARD_*` values are set; `backend/src/ward/config.ts` explains why. The bottom of `.env.example` lists the optional backend settings with their defaults: `PORT`, `HOST`, `DATABASE_PATH`, `CORS_ORIGIN`, `OVERPASS_URL`, `APP_URL` and `INGEST_USER_AGENT`.

## 2. Build `shared` and create the database

```bash
npm run build -w shared          # ui and backend import its compiled output
npm run db:migrate -w backend    # creates backend/data/app.db (gitignored)
npm run db:seed -w backend
```

The seed resets places, events, favourites and notifications. It loads a frozen OpenStreetMap capture of both cities, taken 2026-10-04 and clipped to the city limits, plus an event venue. Then it adds 15 synthetic events dated from the day you run it, so re-seed when they go stale. It refuses to run with `NODE_ENV=production`.

Two optional extras:

- `SEED_DEMO_SUBJECT=<a Ward subject> npm run db:seed -w backend` gives that account two followed places, a saved event and one notification.
- `npm run db:capture-osm -w backend` refreshes the frozen capture from the public Overpass API. Overpass is rate-limited, so run it rarely.

## 3. Run

```bash
npm run dev
```

This starts the API on port 3001 under `tsx watch` and the UI on port 5173 under Vite. Open <http://localhost:5173/prm/>. Local dev is laid out like the deploy: the app under `/prm/`, the API under `/prm-api` and Ward under `/ward`, all on the UI dev server's origin.

If another app already holds port 3001, the API exits with `EADDRINUSE`. Pick another port for both processes, for example `PORT=3011 npm run dev`; the UI's proxy follows `PORT`.

## 4. Sign in and use the admin

1. Start the local Ward and run its `seed.mjs`, as its README in `wzd_auth/infrastructure/local/` describes. The seed writes a working `WARD_APP_KEY` into this repo's `.env` and creates an owner account with `admin` on prm.
2. Restart `npm run dev` so the API picks up the new key.
3. Use **Log in** in the account menu. Ward signs you in and sends you back to `/prm/`.

The admin is at <http://localhost:5173/prm/admin> and needs the `prm:admin` grant. It has the review queue for staged events and a sources page with feed health, refresh, add-source and the per-city OSM sync. The OSM sync calls the public Overpass API and a source refresh fetches the source's feed, so neither is something to click casually.

## 5. Test

```bash
npm test             # Vitest: unit tests and Fastify .inject() API tests
npm run typecheck    # all three workspaces
npm run build        # shared, backend and ui
npm run test:e2e     # Playwright, see below
```

`npm run test:e2e` starts its own API on port 3101, a stand-in Ward on 3102 and the UI on 5174, against a fresh database it migrates and seeds on every run. It never touches your dev database; `playwright.config.ts` has the details. It needs Playwright's Chromium installed. `npm run test:watch` is the TDD loop and `npm run test:cov` adds coverage.

## 6. Build the docs site

```bash
npm run docs -w docs
```

This copies `corpus/wiki/` into the site, compiles the diagrams, runs TypeDoc over `shared/`, and builds the Starlight site into `docs/dist/`. The diagrams are regenerated when the archify skill is installed; otherwise the build checks the committed copies. The deployed copy is at <https://gandolh.ro/prm/docs/>. See [docs/README.md](README.md) for how the site's files are laid out.

## Deploying

The deploy lives in the separate vps-deploy repo, in `stacks/public-resource-map.ts`. It builds the UI with `PRM_BASE=/prm/`, runs the API in Docker from `infrastructure/`, and runs migrations in a throwaway container. Nothing in this repo deploys by itself.
