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
- The structure (the `code-structure` skill): `server.ts` runs the process, `app.ts` builds the app and never
  listens, `config.ts` is the only reader of `process.env` (`n/no-process-env` is an error), `plugins/` holds the
  error handlers and auth (fastify-plugin wrapped), `features/<name>/` one domain each, used from outside only
  through its `index.ts` (dependency-cruiser), `lib/` pure helpers with no Fastify import.
- A new dependency goes in `AppContext` (`app.ts`) and reaches a feature as its plugin options, typed by the
  feature's own `Options`. No decorators, no `declare module "fastify"`.
- Every route declares its schemas (`FastifyPluginAsyncZod`): params, querystring, body, and a response for each
  status the handler sends itself, 4xx as `errorBodySchema`. Never parse request input in a handler. Never declare
  a status the guard answers (401, 403): its body is the library's. A schema the UI imports lives in `shared/`;
  a server-only one in its feature, typed against the shared DTO.
- Errors: throw `ApiError` (`lib/api-error.ts`, one table of codes) or send `{ code, message }` for an expected
  404 or 409. The error plugin never sends a thrown message.
- Every route is admin-gated through `preValidation: requireRole(ROLES.admin)` (before the schemas run, so a
  non-admin gets 403 before any 400), or listed as public in `backend/src/plugins/auth/index.ts`. Anything else
  needs a signed-in user.
- Tests go through `buildTestApp` in `backend/src/test/harness.ts`; tests that span features go in
  `backend/src/test/cross-feature/`.
- Times use `backend/src/lib/time.ts`, which owns the Europe/Bucharest windows.
- Drizzle's better-sqlite3 calls are synchronous: `.all()`, `.get()` and `.run()` are not awaited (lint enforces
  it). A query builder with no finisher is a thenable and runs when awaited.
- A `!` in source is an error: narrow with a guard. Tests may use it (a warning).
- `npm run check:conventions` runs `check-structure` (strict) over these folders; its one exception (`config.ts`
  reads `NODE_ENV` for the iaBilet rule) is in `scripts/conventions.json`.
