# 🌍 Public Resource Map

A place-centric map of public resources in Romanian cities, starting with
Timișoara and București: parks, libraries, clinics, museums and town halls, and
what's on at each of them. It's a proof of concept; see
[corpus/wiki/overview.md](corpus/wiki/overview.md).

## Getting started

```bash
npm install
cp .env.example .env
npm run build -w shared         # the other workspaces import its build
npm run db:migrate -w backend
npm run db:seed -w backend      # resets to Timișoara + București (offline OSM fixture)
npm run dev                     # backend on :3001, UI on :5173
```

Then open http://localhost:5173/prm/. Local dev is laid out like the deploy:
the app under `/prm/`, the API under `/prm-api`, and Ward's sign-in under
`/ward`, all on the UI dev server.

Signing in needs a Ward. Start the local one in
[`../wzd_auth/infrastructure/local`](../wzd_auth/infrastructure/local) and run
its `seed.mjs`, which writes this app's Ward key into `.env`. Without it the
public map still works.

For the CARTO basemap, set `VITE_CARTO_API_KEY` in `.env`. Without a key the map
uses OpenStreetMap tiles.
