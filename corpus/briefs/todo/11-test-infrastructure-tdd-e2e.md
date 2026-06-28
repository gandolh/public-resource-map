# Brief 11 — Test infrastructure & TDD/e2e harness

> Written 2026-06-28. The **machinery** for testing — runners, config, scripts, fixtures, CI, and the TDD workflow. Distinct from [brief 10](10-test-plans-rewrite.md), which is the *test plans* (what to test). 10 assumes this harness exists; **build 11 before 10** (and ideally early, so feature briefs 02–06 can be built test-first). Implements [decisions.md → Testing](../../wiki/decisions.md).

## Problem

The locked testing decision ("assertion-based Playwright on a seeded DB + thin Vitest for auth internals") describes intent, but **no test infrastructure exists**: no test runner, no config, no `.spec` files, no test scripts in any `package.json`. "Playwright" so far has been *manual* browser-driving for screenshots ([playwright/README.md](../../playwright/README.md) + `playwright/screenshots/`). This brief stands up the real harness and a TDD workflow.

## Test pyramid (matches locked decisions)

| Layer | Tool | Scope | Where |
|---|---|---|---|
| **Unit** | Vitest | Pure logic: dedup/normalize, venue↔place matching, geocode-cache key, Bucharest-TZ reminder date math, Zod schema edges | `backend/` + `shared/` co-located `*.test.ts` |
| **Auth internals** (locked) | Vitest | argon2id hashing round-trip, single-use verify/reset tokens, session expiry | `backend/` |
| **API integration** | Vitest + Fastify `.inject()` | Route behavior against a **real temp SQLite DB**: auth flows, admin gate (401/403), ingestion accept/reject, favorites, places API | `backend/` |
| **E2e** (primary) | `@playwright/test` | Full stack against seeded deterministic DB: place-centric map, what's-on, place detail, auth happy-path, favorites→notification, admin ingestion | `e2e/` at repo root |

Component tests (`@testing-library/react`) remain **deferred** per decisions — not in this brief; leave a seam.

## Dependencies (exact-pinned, house style)

Add at the **root** `package.json` (shared tooling) unless noted:

- **`vitest`** — unit/integration runner. Fits the Vite/ESM/tsx setup with near-zero config (shares Vite's transform); already named in the testing decision. *(Jest rejected: extra ESM/TS config friction against the ESM-everywhere project.)*
- **`@vitest/coverage-v8`** — coverage (v8 provider, no Babel). Coverage reported, not gated to a number (decision: not chasing coverage).
- **`@playwright/test`** — the e2e runner (assertions, fixtures, `webServer` auto-start, trace viewer). Replaces the raw `playwright` manual usage. Browsers via `npx playwright install --with-deps chromium` (CI step, not a dep).
- **API integration needs NO new dep** — Fastify's built-in **`.inject()`** (light-my-request, already transitive) drives in-process route tests. House style: use what Fastify gives us; don't add supertest.
- **argon2** (or bcrypt) — already required by brief 02 for auth; its tests live here but the dep belongs to 02.

Pin every version exactly (no `^`), per [decisions.md → Stack](../../wiki/decisions.md).

## Project structure integration

```
public-resource-map/
  package.json          + root test scripts (orchestrate workspaces + e2e)
  vitest.workspace.ts   NEW — Vitest workspace: backend + shared projects
  playwright.config.ts  NEW — e2e config (webServer brings up backend+ui, seeds first)
  e2e/                  NEW — *.spec.ts (was: manual playwright/ screenshots)
    fixtures.ts         seeded-DB + auth-session + geolocation(Timișoara/București) fixtures
    *.spec.ts
  backend/
    src/**/*.test.ts    co-located unit + integration (Fastify .inject())
    vitest.config.ts    NEW — node environment
  shared/
    src/**/*.test.ts    co-located unit tests
  playwright/           KEEP as the manual/visual-audit hub (README, screenshots) — brief 10's
                        visual audit still uses it; automated e2e lives in e2e/
```

Rationale for `e2e/` (not under `playwright/`): keep the **automated assertion suite** separate from the **manual visual-audit hub** so the two testing modes (locked: both exist) don't tangle.

## Scripts (root `package.json`)

```jsonc
"test":        "vitest run",                       // all unit+integration, once
"test:watch":  "vitest",                           // TDD loop
"test:cov":    "vitest run --coverage",
"test:e2e":    "playwright test",                  // config seeds + boots servers
"test:all":    "npm run test && npm run test:e2e"
```

Per-workspace `test` scripts delegate to the root Vitest workspace.

## E2e determinism (critical)

- `playwright.config.ts` **`webServer`** boots backend + ui; a **global setup** runs `db:migrate` + `db:seed` (brief 08 RO seed) into a **throwaway DB file** (e.g. `app.test.db`, gitignored) so tests never touch dev data.
- **Mock geolocation to a Timișoara/București default** via Playwright context (replaces the NYC mock in the README), `grantPermissions(["geolocation"])`.
- Assert against **stable seeded IDs** (brief 08 guarantees them). Reset between specs via re-seed or per-test transaction.
- For the **reminder sweep** (in-process daily job): expose a **test-only trigger** (guarded endpoint or exported function) so e2e can fire the sweep deterministically instead of waiting for 09:00 Bucharest.

## TDD workflow (how we build feature briefs)

- **Red→Green→Refactor** for backend logic (dedup, matching, TZ math, auth): write the Vitest first from the brief's acceptance criteria, then implement.
- For each feature brief (02–06), its acceptance criteria become Vitest/API tests up front; the e2e spec lands when the UI does.
- `test:watch` is the inner loop; `test:all` is the pre-commit/PR gate.

## CI

- **No GitHub Actions / hosted CI** (explicit choice, 2026-06-28). The gate is **local**: `npm run test:all` before commit/push (run manually, or wire a lightweight pre-commit/pre-push git hook if desired — no hosted runner).
- Playwright trace-on-failure is still configured (in `playwright.config.ts`) for local debugging; reports just land in `playwright-report/` (gitignored), not uploaded anywhere.

## Acceptance criteria

- `npm test` runs Vitest across backend+shared (unit + Fastify `.inject()` integration) from a clean checkout.
- `npm run test:e2e` boots servers, seeds a throwaway RO DB, mocks T/B geolocation, and runs assertion-based specs (not screenshot-eyeballing).
- A test-only hook can fire the reminder sweep deterministically.
- Auth-internals Vitest (hashing, single-use tokens, session expiry) exists and is green.
- `npm run test:all` is the local pre-commit gate (no hosted CI); Playwright traces land locally on failure.
- The manual `playwright/` visual-audit hub still works for brief 10's UI audit; automated e2e lives in `e2e/`.
- All test deps are exact-pinned; no component-test deps added (deferred, seam left).
