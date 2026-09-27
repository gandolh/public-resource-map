# Brief 22 — A fresh clone boots: `.env.example`, env loading, README getting-started

> Written 2026-09-27 from the [improvements audit](../../todos/2026-09-27-improvements-audit.md) (#5). Independent. Build before 27/28 (all three touch `backend/package.json`).

## Context

Following the dev commands in [status.md](../../wiki/status.md) literally on a fresh clone kills the backend at boot.

**Reproduced 2026-09-27:** `npx tsx src/index.ts` with no Ward variables set →
`Error: WARD_PUBLIC_ORIGIN is not set. prm cannot authenticate anybody without it — see .env.example.` (thrown from `buildApp` → `wardConfig()`, `backend/src/ward/config.ts:28-36`).

Three things combine:
1. All three Ward variables are required at boot, by design ([decisions.md → Identity is Ward's](../../wiki/decisions.md); `config.ts` explains why there are no defaults). Keep that.
2. **`.env.example` does not exist** anywhere in the repo, though the error message sends people to it.
3. Nothing loads an env file in development. `backend`'s `dev` script is `tsx watch src/index.ts`; the root `.env` (gitignored, holding the three Ward keys) is never read. Compose reads `infrastructure/.env`, a different file.

The public map needs no working Ward. Placeholder values let the backend boot and serve every public route; only sign-in needs a real Ward (`wzd_auth` running locally). Nobody is told this.

The docs around it are stale too:
- The root `README.md` promises to redirect users to iabilet.ro, which the legal decision forbids ([decisions.md → Legal posture](../../wiki/decisions.md)), and has no setup section at all.
- `status.md` says `db:seed` loads NYC data. It loads Timișoara + București.

## Files you OWN
- `.env.example` (new, repo root)
- `backend/package.json` (the `dev` script only)
- `README.md`
- `corpus/wiki/status.md` (the "Dev commands" block only)

## Files you must NOT touch
- `backend/src/ward/config.ts`. No defaults, no dev bypass; failing loudly is the locked behaviour.
- `infrastructure/**`: compose has its own env file.

## What to do
1. **`.env.example`** at the root, one commented block per variable. List every variable the code reads: `WARD_PUBLIC_ORIGIN`, `WARD_API_BASE_PATH`, `WARD_APP_KEY`, `PORT`, `HOST`, `CORS_ORIGIN`, `DATABASE_PATH`, `OVERPASS_URL`, `VITE_API_URL`, `VITE_CARTO_API_KEY`, `PRM_BASE`, `APP_URL`. Re-grep `process.env` and `import.meta.env` to be sure none is missed. For the Ward trio, give local placeholder values and say plainly that with them the map works and sign-in does not.
2. **Load it in dev.** Make `backend`'s `dev` script load the root `.env` when present: Node's `--env-file-if-exists=../.env` passed through `tsx`. Confirm `tsx watch` forwards the flag; if it does not, find the smallest alternative that adds no dependency. A missing `.env` must still produce the loud `config.ts` error, not a new one.
3. **README.** Replace the stale pitch with two honest lines matching [overview.md](../../wiki/overview.md), then a Getting started section: `npm install` → `cp .env.example .env` → `npm run build -w shared` → `npm run db:migrate -w backend` → `npm run db:seed -w backend` → `npm run dev`. Add one sentence each on running with a real Ward and on `VITE_CARTO_API_KEY`. Remove the iabilet line.
4. **status.md:** fix the NYC seed comment.

## Acceptance
- From a clean checkout (`git clone` into a scratch dir), the README steps bring up the backend on :3001 and the UI on :5173, and `GET /api/places?city=Timișoara` returns seeded places.
- With `.env` deleted, `npm run dev -w @public-resource-map/backend` still fails with the existing `WARD_PUBLIC_ORIGIN is not set` message.
- `npm test`, `npm run typecheck` green.
