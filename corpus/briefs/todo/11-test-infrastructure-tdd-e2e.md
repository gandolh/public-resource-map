# Brief 11 — Vitest harness (unit + integration) & TDD workflow

> Written 2026-06-28; **narrowed 2026-06-29** — the **Playwright e2e harness** split to [brief 17](17-playwright-e2e-harness.md). This brief is the **Vitest** machinery (unit + auth-internals + Fastify `.inject()` integration) + the shared test scripts/CI posture + the TDD workflow. Distinct from [brief 10](10-test-plans-rewrite.md) (test *plans* = what to test). **Build 11 early** so feature briefs 02–06 can be built test-first. Implements [decisions.md → Testing](../../wiki/decisions.md).

## Problem

The locked testing decision ("assertion-based Playwright on a seeded DB + thin Vitest for auth internals") describes intent, but **no test infrastructure exists**: no test runner, no config, no `.spec` files, no test scripts in any `package.json`. "Playwright" so far has been *manual* browser-driving for screenshots ([playwright/README.md](../../../playwright/README.md) + `playwright/screenshots/`). This brief stands up the real harness and a TDD workflow.

## Test pyramid (matches locked decisions)

| Layer | Tool | Scope | Where |
|---|---|---|---|
| **Unit** | Vitest | Pure logic: dedup/normalize, venue↔place matching, geocode-cache key, Bucharest-TZ reminder date math, Zod schema edges | `backend/` + `shared/` co-located `*.test.ts` |
| **Auth internals** (locked) | Vitest | argon2id hashing round-trip, single-use verify/reset tokens, session expiry | `backend/` |
| **API integration** | Vitest + Fastify `.inject()` | Route behavior against a **real temp SQLite DB**: auth flows, admin gate (401/403), ingestion accept/reject, favorites, places API | `backend/` |
| **E2e** | `@playwright/test` | Full-stack assertion specs | **→ [brief 17](17-playwright-e2e-harness.md)** |

This brief owns the first three rows (Vitest). The e2e row is [brief 17](17-playwright-e2e-harness.md). Component tests (`@testing-library/react`) remain **deferred** per decisions — leave a seam.

## Dependencies (exact-pinned, house style)

Add at the **root** `package.json` (shared tooling) unless noted:

- **`vitest`** — unit/integration runner. Fits the Vite/ESM/tsx setup with near-zero config (shares Vite's transform); already named in the testing decision. *(Jest rejected: extra ESM/TS config friction against the ESM-everywhere project.)*
- **`@vitest/coverage-v8`** — coverage (v8 provider, no Babel). Coverage reported, not gated to a number (decision: not chasing coverage).
- **API integration needs NO new dep** — Fastify's built-in **`.inject()`** (light-my-request, already transitive) drives in-process route tests. House style: use what Fastify gives us; don't add supertest.
- **argon2** (or bcrypt) — already required by brief 02 for auth; its tests live here but the dep belongs to 02.
- **`@playwright/test`** — belongs to [brief 17](17-playwright-e2e-harness.md), not here.

Pin every version exactly (no `^`), per [decisions.md → Stack](../../wiki/decisions.md).

## Project structure integration

```
public-resource-map/
  package.json          + root test scripts (test/test:watch/test:cov; test:all → adds 17's e2e)
  vitest.workspace.ts   NEW — Vitest workspace: backend + shared projects
  backend/
    src/**/*.test.ts    co-located unit + integration (Fastify .inject())
    vitest.config.ts    NEW — node environment
  shared/
    src/**/*.test.ts    co-located unit tests
```

(The `e2e/` dir, `playwright.config.ts`, and keeping `playwright/` as the manual visual-audit hub are [brief 17](17-playwright-e2e-harness.md).)

## Scripts (root `package.json`)

```jsonc
"test":        "vitest run",                       // all unit+integration, once
"test:watch":  "vitest",                           // TDD loop
"test:cov":    "vitest run --coverage"
// "test:e2e" and "test:all" are added by brief 17 (test:all = test && test:e2e)
```

Per-workspace `test` scripts delegate to the root Vitest workspace.

## Reminder sweep — testable unit (locked 2026-06-28)

Implement the daily job as **`runReminderSweep(now)`** taking the current time; the prod scheduler calls it on a timer. **Unit-test it directly** with a fixed Europe/Bucharest `now` and assert idempotency (re-run → no duplicate). **No test-only HTTP route.** (This makes the sweep a Vitest concern, not an e2e one.)

## TDD workflow (how we build feature briefs)

- **Red→Green→Refactor** for backend logic (dedup, matching, TZ math, auth): write the Vitest first from the brief's acceptance criteria, then implement.
- For each feature brief (02–06), its acceptance criteria become Vitest/API tests up front; the e2e spec (brief 17) lands when the UI does.
- `test:watch` is the inner loop; `test:all` (with brief 17's e2e) is the pre-commit gate.

## CI

- **No GitHub Actions / hosted CI** (explicit choice, 2026-06-28). The gate is **local**: `npm run test:all` before commit/push (run manually, or wire a lightweight pre-commit/pre-push git hook if desired — no hosted runner).
- Playwright trace-on-failure is still configured (in `playwright.config.ts`) for local debugging; reports just land in `playwright-report/` (gitignored), not uploaded anywhere.

## Acceptance criteria

- `npm test` runs Vitest across backend+shared (unit + Fastify `.inject()` integration) from a clean checkout.
- Auth-internals Vitest (hashing, single-use tokens, session expiry) exists and is green.
- `runReminderSweep(now)` is unit-tested with a fixed Bucharest `now` and proven idempotent on re-run.
- `test`/`test:watch`/`test:cov` scripts exist; `test:all` is wired once brief 17 adds `test:e2e`.
- All Vitest deps are exact-pinned; no component-test deps added (deferred, seam left).

_(E2e harness criteria → [brief 17](17-playwright-e2e-harness.md).)_
