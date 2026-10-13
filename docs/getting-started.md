# Getting started

The full local setup. The [main README](../README.md) has the short version.

## Prerequisites

- Node 24 and npm. Tested with Node 24.14.1.
- The public map needs nothing else. SQLite runs inside the API process, and the seed works offline.
- Signing in, favourites, notifications and the admin work on prm's own local accounts, so they need nothing else. "Sign in with Ward" is optional and needs the local Ward container from the sibling `wzd_auth` repo, in `wzd_auth/infrastructure/local/`. Its README covers starting it.

## 1. Install and configure

From the repo root:

```bash
npm install
cp .env.example .env
```

`npm run dev` loads `.env` into both the API and the UI dev server. The deploy does not read it; vps-deploy passes its own values.

| Variable | Default in `.env.example` | Purpose |
|---|---|---|
| `PUBLIC_ORIGIN` | `http://localhost:5173` | The origin the browser loads prm from, no path. The session cookie's `Secure` flag and the same-origin check on sign-in posts depend on it. |
| `WARD_OIDC_ISSUER` | unset (commented out) | Optional. Ward's issuer, `http://localhost:8792/ward-api/oidc` locally. Unset, prm runs on local accounts only. |
| `WARD_OIDC_CLIENT_ID`, `WARD_OIDC_CLIENT_KEY` | unset | prm's client id (`prm`) and its private key at Ward. The key is a secret. Ward's `seed.mjs` writes both. |
| `WARD_OIDC_REDIRECT_URI` | unset | The callback as the browser reaches it, `http://localhost:5173/prm-api/auth/ward/callback`. |
| `WARD_OIDC_POST_LOGOUT_REDIRECT_URI` | unset | Optional. Where Ward returns after "Sign out of Ward too", `http://localhost:5173/prm/`. |
| `AUTH_TRUSTED_PROXIES` | unset | Optional. Proxies whose `X-Forwarded-For` the sign-in lockout believes. Set it in a container, not locally. |
| `PRM_BASE` | `/prm/` | The path the app is served under, as in the deploy. |
| `VITE_API_URL` | `/prm-api` | Where the app calls the API. The dev server proxies it to the backend. |
| `VITE_CARTO_API_KEY` | unset | CARTO basemap tiles. Without a key the map uses OpenStreetMap tiles, toned down toward the same look; see `ui/app/lib/map.ts`. |
| `VITE_DATA_CONTACT` | placeholder address | The takedown contact shown on `/about-data`. |
| `NOMINATIM_USER_AGENT` | placeholder contact | Nominatim's policy wants an identifying User-Agent. Without it the pipeline geocodes nothing and unmatched venues wait for a manual pin. |

With `WARD_OIDC_ISSUER` set, the client id, key and redirect URI are required too and the API refuses to start without them; leave the issuer unset to run on local accounts only. The bottom of `.env.example` lists the optional backend settings with their defaults: `PORT`, `HOST`, `DATABASE_PATH`, `CORS_ORIGIN`, `OVERPASS_URL`, `APP_URL` and `INGEST_USER_AGENT`.

## 2. Build `shared` and create the database

```bash
npm run build -w shared          # ui and backend import its compiled output
npm run db:migrate -w backend    # creates backend/data/app.db (gitignored)
npm run db:seed -w backend
```

The seed resets places, events, favourites and notifications. It loads a frozen OpenStreetMap capture of both cities, taken 2026-10-04 and clipped to the city limits, plus an event venue. Then it adds 15 synthetic events dated from the day you run it, so re-seed when they go stale. It refuses to run with `NODE_ENV=production`.

Two optional extras:

- `SEED_DEMO_USERNAME=<a username> SEED_DEMO_PASSWORD=<a password> npm run db:seed -w backend` gives that local user two followed places, a saved event and one notification. The password is needed only the first time.
- `npm run db:capture-osm -w backend` refreshes the frozen capture from the public Overpass API. Overpass is rate-limited, so run it rarely.

## 3. Run

```bash
npm run dev
```

This starts the API on port 3001 under `tsx watch` and the UI on port 5173 under Vite. Open <http://localhost:5173/prm/>. Local dev is laid out like the deploy: the app under `/prm/`, and the API under `/prm-api`, both on the UI dev server's origin. There is no `/ward` proxy: "Sign in with Ward" sends the browser to Ward's own origin and back to the callback under `/prm-api`.

If another app already holds port 3001, the API exits with `EADDRINUSE`. Pick another port for both processes, for example `PORT=3011 npm run dev`; the UI's proxy follows `PORT`.

## 4. Sign in and use the admin

Sign in with a local account:

1. Create one with `npm run db:seed-users -w backend`. It reads `SEED_USERNAME`, `SEED_PASSWORD` and `SEED_ROLE` (`user` or `admin`) from the environment, or asks on the terminal. `npm run db:set-role -w backend -- <username> admin` promotes an existing user.
2. Use **Log in** in the account menu and sign in with that username and password. It sends you back to `/prm/`.

To use "Sign in with Ward" instead, start the local Ward and run its `seed.mjs`, as its README in `wzd_auth/infrastructure/local/` describes. The seed writes the `WARD_OIDC_*` values into this repo's `.env`; restart `npm run dev` so the API picks them up, then use the Ward button on the login page.

The admin is at <http://localhost:5173/prm/admin> and needs the `admin` role. It has the review queue for staged events and a sources page with feed health, refresh, add-source and the per-city OSM sync. The OSM sync calls the public Overpass API and a source refresh fetches the source's feed, so neither is something to click casually.

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

This copies `corpus/wiki/` into the site, compiles the diagrams, runs TypeDoc over `shared/`, and builds the Starlight site into `docs/dist/`. The diagrams are regenerated when the archify skill is installed; otherwise the build checks the committed copies. The deployed copy is at `/prm/docs/`. See [docs/README.md](README.md) for how the site's files are laid out.

## Deploying

The deploy lives in the separate vps-deploy repo, in `stacks/public-resource-map.ts`. It builds the UI with `PRM_BASE=/prm/`, runs the API in Docker from `infrastructure/`, and runs migrations in a throwaway container. Nothing in this repo deploys by itself.
