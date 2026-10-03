# Brief 17 — Playwright e2e harness

> Split from [brief 11](11-test-infrastructure-tdd-e2e.md) on 2026-06-29 — a separate runner (Playwright vs Vitest) with its own config, fixtures, server bring-up, and seeded-DB determinism. Depends on **brief 08** (RO seed it asserts against) + **brief 11** (shares the root test scripts). Implements [decisions.md → Testing](../../wiki/decisions.md).

## Goal

Full-stack, **assertion-based** e2e (not screenshot-eyeballing) against a **seeded deterministic DB**: place-centric map, what's-on, place detail, draw-to-filter, auth happy-path, favorites→notification, admin ingestion review.

## Dependencies (exact-pinned)

- **`@playwright/test`** — runner (assertions, fixtures, `webServer` auto-start, trace viewer). Replaces the old raw `playwright` manual screenshot usage. Browsers installed via `npx playwright install chromium` (a local step, not a dependency).

## Project structure

```
public-resource-map/
  playwright.config.ts  NEW — webServer brings up backend+ui, global setup seeds first
  e2e/                  NEW — *.spec.ts (the automated assertion suite)
    fixtures.ts         seeded-DB + per-role auth (storageState) + T/B geolocation fixtures
    *.spec.ts
  playwright/           KEEP as the manual/visual-audit hub (README, screenshots) — brief 10's
                        visual audit still uses it; automated e2e lives in e2e/
```

Rationale for `e2e/` (not under `playwright/`): keep the **automated assertion suite** separate from the **manual visual-audit hub** so the two testing modes (both locked) don't tangle.

## Scripts (root `package.json`, added to brief 11's)

```jsonc
"test:e2e": "playwright test",                 // config seeds + boots servers
"test:all": "npm run test && npm run test:e2e" // local pre-commit gate
```

## Determinism (critical)

- `playwright.config.ts` **`webServer`** boots backend + ui; a **global setup** runs `db:migrate` + `db:seed` (brief 08 RO seed) into a **throwaway DB file** (e.g. `app.test.db`, gitignored) so tests never touch dev data.
- **Mock geolocation to a Timișoara/București default** via Playwright context (replaces the old NYC mock), `grantPermissions(["geolocation"])`.
- Assert against **stable seeded IDs** (brief 08 guarantees them).

## Patterns (locked 2026-06-28, from research)

- **DB isolation: seed once + reset for mutators.** Read-only specs (browse map, view place, what's-on, draw-filter) share the seeded DB. **Mutating specs** (admin accept, favorite→notify) re-seed or run in a transaction-rolled-back fixture so they don't leak.
- **Auth: setup project + per-role `storageState`.** A Playwright `setup` project logs in once as the seeded demo **user** and **admin**, saving `authState.user.json` / `authState.admin.json` (**gitignored**); specs declare the role they need (project dependencies). **Plus** a few explicit specs exercising the real login/register/verify/reset UI *without* storageState.
- The **reminder sweep** is unit-tested via `runReminderSweep(now)` (brief 11), not e2e — no test-only HTTP route.

## CI / gate

- **No hosted CI** (locked). `npm run test:all` is the local pre-commit gate. Playwright **trace-on-failure** configured for local debugging; reports land in `playwright-report/` (gitignored), not uploaded.

## Acceptance criteria

- `npm run test:e2e` boots servers, seeds a throwaway RO DB, mocks T/B geolocation, and runs assertion-based specs from a clean checkout.
- Per-role `storageState` works (user + admin); a few specs cover the real auth UI without it.
- Specs exist for: place-centric map + clustering, what's-on, place detail/deep-link, draw-to-filter, favorites→notification, admin review accept/reject.
- DB isolation holds (mutating specs don't leak); traces land locally on failure.
- The manual `playwright/` visual-audit hub still works for brief 10's UI audit.

## Outcome (2026-10-03)

The harness is built and runs green. The specs that cover auth, favorites and
admin review are **not** written, because what they would test no longer exists
or does not exist yet.

**Built:**
- `@playwright/test` 1.63.0 (exact-pinned) and `playwright.config.ts`.
  - Two `webServer`s on their own ports: API :3101, UI :5174.
    `reuseExistingServer: false`, so a running dev stack is never touched.
  - The API's command drops `e2e/.data/app.e2e.db` (gitignored), migrates,
    seeds, then serves. A global setup was unnecessary.
  - The UI is the dev server with its proxy pointed at :3101.
  - Geolocation is mocked to Timișoara's centre (it was NYC).
  - `Europe/Bucharest` timezone, trace `retain-on-failure`, an HTML report never
    opened. `test-results/` and `playwright-report/` are gitignored.
- `e2e/fixtures.ts`: an English-UI `page` (Romanian stays the product default),
  and `placeNamed()`. Seed IDs are random until brief 08 makes them stable, so
  specs find rows by real name.
- Scripts: `npm run test:e2e` and `npm run test:all` (Vitest, then e2e).
- **Nine specs, all passing on two consecutive runs** (about 10 s):
  - **map:** opens on Timișoara with pins or clusters; a chip and the "Today"
    lens narrow the same count; the attribution credits OSM contributors and its
    link reaches /about-data.
  - **what's on:** every row names its source and the count matches the rows; a
    row opens its place.
  - **place:** a cold deep link opens the place with a linked source credit; a
    București link switches the city.
  - **draw-to-filter, with real mouse input:** a freehand loop narrows the map,
    and the chip clears it. A polygon carries over to what's on, and a city change
    clears it with the notice.
- **It found a bug on its first run.** While drawing, a polygon corner placed on
  a pin or cluster opened that place. Leaflet's `.leaflet-interactive` restores
  pointer events on each icon, overriding brief 15's pane-level `none`. Fixed in
  `app.css` (the pane *and its descendants*). The spec fails without the fix and
  passes with it.

**Not built, and where each goes:**
- **Per-role `storageState` and the auth-UI specs** belong to the pre-Ward
  design. Login, register, verify and reset are Ward's pages now, and prm has no
  users of its own. Signed-in e2e needs a decision: an in-process fake Ward for
  the e2e backend (as the Vitest harness does), or the real local Ward container
  with test accounts whose credentials live outside the repo. Until then the e2e
  backend gets a Ward origin nothing listens on, and specs browse signed out
  (the guard answers 401 to a cookie-less request without asking Ward).
- **favorites→notification** specs come with brief 05, and **admin review
  accept/reject** with briefs 04 and 16. Neither feature exists.
- **DB isolation for mutating specs:** there are no mutating specs yet. Each run
  starts from a fresh database; the first mutating spec should re-seed or use
  its own DB.
- The manual `playwright/` hub is untouched.
