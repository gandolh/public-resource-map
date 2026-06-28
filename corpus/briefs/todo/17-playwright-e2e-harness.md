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
