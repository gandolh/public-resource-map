# Test Plans — CivicMap

What "tested" means for each surface, and which test proves each case. Most
cases are automated. The plans hold the cases that are not: what the e2e suite
cannot reach (Ward sign-in) and what needs eyes (the UI audit).

## How a run works

**1. Automated (every change):**

```bash
npm test           # Vitest: backend API (Fastify .inject), shared, ui lib
npm run test:e2e   # Playwright: its own API (:3101) + UI (:5174), fresh seeded DB
npm run typecheck
```

- The e2e suite seeds its own throwaway database (brief 08's seed: frozen OSM
  places, synthetic events, stable ids in `SEED`).
- It stands as a visitor in Timișoara and never touches dev data.
- Signed-in specs sign in through a **fake Ward** the suite starts
  (`e2e/fake-ward/server.ts`, port 3102): it serves JWKS and `/introspect` and
  mints real EdDSA tokens, so the backend verifies them for real. Decided
  2026-10-04.

**2. Manual, against the local Ward (TP-04 to TP-07, before a release):**

- Ward runs in Docker at `localhost:8792`. The dev server proxies `/ward` to
  it, and credentials are in `~/.config/ward/local.env`, never in the repo.
- Point the dev stack at a scratch database so dev data survives, because the
  seed resets:

  ```bash
  export DATABASE_PATH=/tmp/prm-walk.db
  npm run db:migrate -w backend && npm run db:seed -w backend
  npm run dev        # → http://localhost:5173/prm/
  ```

- Once signed in, reseed with `SEED_DEMO_SUBJECT=<subject from /api/me>`
  for TP-06.
- Walk the manual cases. Screenshots go in `playwright/` (gitignored).
- Record pass/fail in [RESULTS.md](RESULTS.md), and file durable findings as
  corpus todos.

## Plans

| ID | File | Area | Automated cover |
|---|---|---|---|
| TP-01 | [TP-01-map.md](TP-01-map.md) | The map: pins, filters, lens, draw, city, attribution | e2e map, filters, draw-to-filter |
| TP-02 | [TP-02-whats-on.md](TP-02-whats-on.md) | What's on: the citywide index | e2e whats-on, archive; api whats-on |
| TP-03 | [TP-03-place.md](TP-03-place.md) | The place: panel/sheet, programme, deep links | e2e place |
| TP-04 | [TP-04-ui-audit.md](TP-04-ui-audit.md) | UI audit: design rules, themes, 375 px, a11y, attribution | manual |
| TP-05 | [TP-05-sign-in.md](TP-05-sign-in.md) | Sign-in via Ward, the admin gate | api ward client/plugin, gates; e2e sign-in, admin, signed-in |
| TP-06 | [TP-06-favourites.md](TP-06-favourites.md) | Favourites, bell, reminders | api favorites, reminder sweep, archive; e2e favorites, signed-in |
| TP-07 | [TP-07-admin-ingestion.md](TP-07-admin-ingestion.md) | Admin ingestion: sources, diff, queue, accept | api admin-ingest, osm; e2e signed-in (the gate) |

Retired: the old TP-01 to TP-04 described the event-centric UI (`/events`,
`/resources/:id`) on an NYC seed. Git history has them.
