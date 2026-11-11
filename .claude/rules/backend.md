---
paths:
  - "backend/src/**"
  - "shared/src/**"
---

# The API and its schemas (`backend/src`, `shared/src`)

- Read the `code-structure` skill and [corpus/wiki/architecture.md](../../corpus/wiki/architecture.md) before you
  add or move a route or a module.
- The zod schemas in `shared/` are the API contract, and `shared` builds first.
- `backend/vendor/` is Ward's generated library. Never edit it.
- Every route is admin-gated through `requireRole(ROLES.admin)`, or listed as public in `backend/src/ward/auth.ts`.
  Anything else needs a signed-in user.
- Tests go through `buildTestApp` in `backend/src/test/harness.ts`.
- Times use `backend/src/lib/time.ts`, which owns the Europe/Bucharest windows.
- Drizzle's better-sqlite3 calls are synchronous: `.all()`, `.get()` and `.run()` are not awaited (lint enforces
  it). A query builder with no finisher is a thenable and runs when awaited.
- A `!` in source is an error: narrow with a guard. Tests may use it (a warning).
- The server has no `config.ts` yet, so `process.env` reads are warnings for now. Add no new reader.
- `npm run check:conventions` runs `check-structure` over these folders, `--warn-only` for now.
