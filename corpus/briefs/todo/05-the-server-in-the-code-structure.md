# Task 05: The server in the house code structure

**Depends on:**

- In public-resource-map: [brief 03](03-the-house-style-harness.md), for the gate, `eslint-plugin-n`'s `no-process-env` (a warning until this brief) and `.claude/rules/backend.md`.
- In the owner's skills library:
  - brief 03, *A code-structure skill for the Fastify + React apps*: rules 1-11, the `server-skeleton.md` reference, `zod-type-provider.md`, `migrating-a-server.md`, `check-structure.mjs`, and the dependency-cruiser and knip presets;
  - brief 16, *The Fastify servers adopt the code structure*: this repo's row and the method, including the zod 3 to 4 move;
  - brief 15, *Enforce the base-ui and code-structure skills in every repo*: `check-structure` runs `--warn-only` until this brief is done.
- The owner's grilling of 2026-11-10:
  - Q1 is answered: every service runs in a container built from `infrastructure/Dockerfile`, which starts a file path, and the build runs `npm ci` and `tsc` only. So the entry rename changes the Dockerfile's `CMD` in the same commit, and this repo owns that file;
  - the technical calls of 2026-11-10 settle Q23 (`features/<name>/`), Q24 (plugin options, explicit registration), Q25 and Q53 (response schemas, with the stream and binary exemption), Q27 (the test runner), Q43 (error bodies), Q52 and Q54-Q56.

**Order:** after 03. It touches nothing under `ui/`, so it can run before or after [brief 04](04-base-ui-by-the-conventions.md), but never at the same time (both change `package-lock.json` and the corpus status page). Run it **before** [brief 01](01-a-source-registry-and-shareable-map-links.md), so 01's adapter and registry changes land in the new folders (see Interplay).

**Before you start:** run `brief-board guide` ([corpus/CLAUDE.md](../../CLAUDE.md)).

## Context

The owner asked on 2026-11-09 for one researched code structure, enforced in every repo. This server is part of the way there:

- `buildApp(opts)` in `backend/src/app.ts` never listens, and `backend/src/index.ts` (26 lines) is the only caller of `listen`;
- tests build the app through `buildTestApp` (`backend/src/test/harness.ts`) and drive it with `inject()`: 15 of the 26 test files call `inject(`, and 17 call `buildTestApp`;
- the vendored Ward plugin is registered before every route, with the public routes listed in `backend/src/ward/auth.ts:45-54`.

What is missing:

- one reader of the environment: **12 files read `process.env`**, three of them check `NODE_ENV`;
- the `server.ts` name, `close-with-grace`, explicit timeouts and `trustProxy`;
- feature folders: the code splits by layer (`routes/`, `ingest/`, `lib/`, `db/`);
- route schemas: no route declares one, so every reply goes through `JSON.stringify`;
- an error handler: there is no `setErrorHandler` and no `setNotFoundHandler` (`grep -rn "setErrorHandler\|setNotFoundHandler" backend/src` prints nothing), so a thrown error reaches the client through Fastify's default handler, message included;
- three Fastify decorators (`db`, `auth`, `notifyMail`, `backend/src/app.ts:17-25`) and a `declare module "fastify"`, where the structure uses typed plugin options;
- zod 4: the repo resolves zod 3.25.76.

### The versions (verified 2026-11-10)

- **zod 3.25.76** in `shared/package.json` and `backend/package.json`, one copy in `package-lock.json` (`node_modules/zod` at line 24103). `@fastify/type-provider-zod` 1.0.3 needs `zod >=4.2.0`, so this brief starts with a zod 4 move. `ui` has no direct zod dependency; it gets zod through `shared`.
- **fastify 5.12.7**; the latest is 5.12.8 (`npm view fastify version`), and the provider needs `^5.5.0`. Not bumped here (decision 9).
- **`@fastify/type-provider-zod` 1.0.3** declares peers `zod >=4.2.0`, `fastify ^5.5.0`, `openapi-types ^12.1.3` and `@fastify/swagger >=9.5.1`. The last two are not optional, so npm installs them: `@fastify/swagger` 9.9.3 and `openapi-types` 12.1.3 are the latest. Pin both and note them in the dependency list. It is type-only weight.
- **New dependencies**: `fastify-plugin` 6.0.1 and `close-with-grace` 2.5.0, both pinned.

### The zod 3 to 4 move, measured 2026-11-10

On a scratch copy of `shared` and `backend` with zod 4.6.7 installed (the repo's `node_modules` linked, `zod` replaced), nothing changed in the source:

- `tsc -p shared` printed 0 errors, and `shared`'s 38 tests passed;
- `tsc -p backend --noEmit` printed 0 errors, and `backend`'s 172 tests passed.

So the move is a version change and a lockfile diff. Not measured: the 24 UI tests, the UI build (`shared`'s dist is bundled into it, so check its size before and after), and the Playwright suite. One behaviour to watch: the 14 hand-written error replies send `parsed.error.message`, which is zod's text. The text changes with the version, and no test asserts it (tests assert 400 only three times, and not the `INVALID_*` codes), so step 1 adds tests for those codes before the move.

### The response-schema trap does not hit the existing schemas

The provider's serializer calls zod's encode path, and **it throws on any `.transform()` in a response schema** (reproduced on zod 4.5.4; the skills library's Round 8 fact). The only transform in `shared/src` is `csvSchema` (`shared/src/types/common.ts:70-72`), and it sits in query schemas, which are decoded, so it is fine. The existing output schemas (`placeSchema`, `eventSchema`, `whatsOnItemSchema`, `osmSyncResultSchema`) hold no transform. `.default()` appears in `shared/src/types/event.ts:48` and `shared/src/types/place.ts:56`; step 6 tests both on the encode path.

### The move map: every file under `backend/src/` (64 TypeScript files, 26 of them tests, plus `db/fixtures/osm-places.json`; 7,954 lines)

A bare file name sits at the root of `backend/src/`. Every file one folder deeper needs its relative imports updated. Ten files import the vendored library by a relative path (`../vendor/…` or `../../vendor/…`); after the move, features import `requireRole` and `ROLES` through `plugins/auth/index.ts`, so only the auth plugin and the `db/` CLIs name the vendor path. The Dockerfile copies `backend/vendor` next to `backend/dist` (`infrastructure/Dockerfile:62`), so `dist/` mirrors `src/`'s depth and the image needs no change for it.

The directory stays `backend/`, not `server/`. Renaming it would touch the Dockerfile's `COPY` lines, the compose volume (`../backend/data`), the `prm-migrate` entrypoint (`-w @public-resource-map/backend`), the workspace name and the vitest projects, for no gain. The skills library's checker looks for `server/` and `web/`; this repo records the names in `scripts/conventions.json`.

| Today | Lines | Target | Note |
|---|---|---|---|
| `index.ts` | 26 | `server.ts` | The entry: `loadConfig()`, `buildApp`, `close-with-grace`, `listen`. The reminder sweep starts here, as today. |
| `app.ts` | 124 | the same | Keeps `buildApp`. Loses the three decorators and `declare module "fastify"` (decision 2). Registers: errors, provider compilers, auth, then the features by name. |
| (new) | | `config.ts` | The one environment parse (below). |
| `ward/auth.ts`, `ward/auth.api.test.ts` | 150, 212 | `plugins/auth/index.ts` and `plugins/auth/auth.api.test.ts` | `registerAuth`, `PUBLIC_ROUTES`, `ROLES`, `storeHandle`. Re-exports `requireRole` from the vendor library. Wrapped in `fastify-plugin`, so the library's guard stays a root hook. |
| `ward/subjects.ts`, `ward/subjects.test.ts` | 88, 82 | `plugins/auth/subjects.ts`, `plugins/auth/subjects.test.ts` | |
| (new) | | `plugins/errors.ts` | The error and not-found handlers (below). |
| `routes/places.ts`, `routes/places.api.test.ts` | 223, 92 | `features/places/routes.ts`, `features/places/places.api.test.ts` | `rowToPlace` (line 25) moves beside it as `mapper.ts`. Five routes. |
| `routes/events.ts`, `routes/events.api.test.ts` | 124, 48 | `features/events/routes.ts`, `features/events/events.api.test.ts` | Four routes. |
| `routes/event-mapper.ts`, `routes/event-window.ts` | 28, 40 | `features/events/mapper.ts`, `features/events/window.ts` | Used by `places`, `archive`, `whats-on` and `events`. |
| (new) | | `features/events/index.ts` | What the other features may import: `rowToEvent`, `liveInWindow`. |
| `routes/whats-on.ts`, `routes/whats-on.api.test.ts` | 76, 109 | `features/whats-on/routes.ts`, `features/whats-on/whats-on.api.test.ts` | Imports `../events/index.js`. |
| `routes/archive.ts`, `routes/archive.api.test.ts` | 90, 73 | `features/archive/routes.ts`, `features/archive/archive.api.test.ts` | Imports `../events/index.js`. |
| `routes/favorites.ts` (lines 1-60), `routes/favorites.api.test.ts` | 136, 121 | `features/favorites/routes.ts`, `features/favorites/favorites.api.test.ts` | Five routes. |
| `routes/favorites.ts` (lines 61-136) | | `features/notifications/routes.ts` | `GET /api/notifications` and `POST /api/notifications/read`. Split because it is a second feature; the shared `404` helper (line 18) is two lines and is copied. |
| `routes/admin-osm.ts`, `routes/admin-osm.api.test.ts` | 62, 97 | `features/osm/routes.ts`, `features/osm/admin-osm.api.test.ts` | |
| `lib/osm-sync.ts`, `lib/osm-sync.test.ts`, `lib/osm-categories.ts`, `lib/osm-categories.test.ts` | 541, 537, 66, 62 | `features/osm/sync.ts`, `sync.test.ts`, `categories.ts`, `categories.test.ts` | `sync.ts` is over rule 11's 400 lines: a warning to leave, nothing is added to it. |
| (new) | | `features/osm/index.ts` | What `ingest` uses from the sync: its Overpass-area helpers and types (`geocode.ts` and `pipeline.ts` import `lib/osm-sync.js` today). |
| `routes/admin-ingest.ts`, `routes/admin-ingest.api.test.ts` | 158, 326 | `features/ingest/routes.ts`, `features/ingest/admin-ingest.api.test.ts` | Nine routes. |
| `ingest/adapters.ts`, `adapters.test.ts`, `ical.ts`, `ical.test.ts`, `geocode.ts`, `geocode.test.ts`, `match.ts`, `match.test.ts`, `pipeline.ts` | 62, 66, 213, 165, 136, 72, 114, 60, 580 | `features/ingest/` (same names) | `pipeline.ts` is over 400 lines: leave. Brief 01 edits `adapters.ts` and `pipeline.ts` after this move. |
| (new) | | `features/ingest/index.ts` | `defaultIngestDeps` and the types `app.ts` passes in. |
| `lib/notify.ts`, `lib/notify-mail.ts`, `lib/notify-mail.test.ts`, `jobs/reminder-sweep.ts`, `lib/reminder-sweep.test.ts` | 60, 295, 217, 87, 67 | `features/reminders/` (same names) | The test for `jobs/reminder-sweep.ts` sits in `lib/` today; it moves beside its source. `ingest/pipeline.ts` imports `notify.ts`, so `features/reminders/index.ts` exports it. |
| `lib/geo.ts`, `lib/time.ts`, `lib/fk.ts` and their tests | 15, 125, 20 | the same | Pure helpers: no Fastify import, which the checker proves. |
| `db/*` (schema, index, migrate, seed, seed-data, seed-ids, seed-users, set-role, capture-osm, accounts-cli, fixtures and their tests) | | the same | The CLIs and the migrator keep their paths: `backend/package.json` scripts and the compose `prm-migrate` entrypoint name `src/db/migrate.ts`. Their environment reads move to `config.ts`. |
| `test/harness.ts`, `test/fake-ward.ts` | 88, 88 | the same | Keeps `buildTestApp` (the skills library's name) in a `test/` folder, not `testing/`. Record it in `conventions.json` if the checker looks for the folder. Its `signIn` read `app.auth`; it builds the accounts from its own `sqlite` handle instead (decision 2). |
| `routes/retired.api.test.ts`, `routes/in-progress.api.test.ts`, `routes/paging.api.test.ts`, `routes/writes.api.test.ts` | 90, 99, 60, 153 | `features/<feature>/…` by what each tests | Read each: they cross features. A test that spans several stays in `test/` as `cross-feature/*.api.test.ts`. |

**Feature boundaries after the move** (rule 5: other features import only through `index.ts`):

- `places`, `whats-on` and `archive` import from `features/events/index.ts`;
- `ingest` imports from `features/osm/index.ts` and `features/reminders/index.ts`.

No cycle: `events` imports no other feature.

**Handlers keep their queries.** The structure puts SQL in a per-feature `store.ts`. Here the handlers call Drizzle directly (2,355 lines across `routes/`, tests included). Extracting stores while changing the file layout, the schemas and the error handling would put four changes in one diff. Decided (Q54): not in this brief. The move leaves the files whole.

### Every reader of the environment (19 sites in 12 files, read 2026-11-10)

Command: `grep -rn "process\.env" --include=*.ts backend/src`.

| Where | What | Afterwards |
|---|---|---|
| `backend/src/index.ts:13` | `PORT`, default 3001 | `config.port` |
| `backend/src/index.ts:14` | `HOST`, default `0.0.0.0` | `config.host` |
| `backend/src/app.ts:67` | `CORS_ORIGIN`, default `http://localhost:5173` | `config.corsOrigin` |
| `backend/src/db/index.ts:11` | `DATABASE_PATH`, default `backend/data/app.db` | `config.databasePath` |
| `backend/src/db/migrate.ts:10` | `DATABASE_PATH`, the same default, copied | `config.databasePath` |
| `backend/src/db/seed.ts:17` | `DATABASE_PATH`, the same default, copied again | `config.databasePath` |
| `backend/src/db/accounts-cli.ts:18` | `DATABASE_PATH`, a fourth copy (`dbPath`) | `config.databasePath` |
| `backend/src/db/accounts-cli.ts:39` | `process.env[name]` for any name a CLI asks for, or a prompt | `fromEnvOrPrompt(name, …)` takes `env` as a parameter; `config.ts` passes the seed names through `loadSeedConfig()` |
| `backend/src/db/seed.ts:21` | `NODE_ENV`, refuses the demo seed in production | `config.production` (decision 4) |
| `backend/src/db/seed.ts:33` | `SEED_DEMO_USERNAME` | `loadSeedConfig()` |
| `backend/src/db/seed.ts:38` | `SEED_DEMO_PASSWORD` | `loadSeedConfig()` |
| `backend/src/db/seed-users.ts:21` | `SEED_ROLE`, default `user` | `loadSeedConfig()` |
| `backend/src/ingest/adapters.ts:52` | `INGEST_USER_AGENT` | `config.ingestUserAgent` |
| `backend/src/ingest/pipeline.ts:40` | `NOMINATIM_USER_AGENT` | `config.nominatimUserAgent` |
| `backend/src/ingest/pipeline.ts:43` | `NODE_ENV`, the production flag that refuses iaBilet | `config.production` (decision 4) |
| `backend/src/lib/notify-mail.ts:56` | `APP_URL` | `config.appUrl` |
| `backend/src/lib/osm-sync.ts:122` | `OVERPASS_URL`, default the public Overpass endpoint | `config.overpassUrl` |
| `backend/src/ward/auth.ts:95-98` | `PUBLIC_ORIGIN`, and `NODE_ENV` to decide whether a missing one stops the boot | `config.publicOrigin`, required |
| `backend/src/ward/auth.ts:105-106` | `PRM_BASE`, default `/prm/` | `config.appBase` |
| `backend/src/ward/auth.ts` (`wardClientOptionsFromEnv()`) | the vendored library reads `WARD_OIDC_ISSUER`, `_CLIENT_ID`, `_CLIENT_KEY`, `_REDIRECT_URI` and `_POST_LOGOUT_REDIRECT_URI` from `process.env` by default (`backend/vendor/ward/ward-auth.js:4045-4059`) | `config.ts` reads them and passes the object in: the function takes `env` as a parameter |

Outside `backend/`, and out of scope: `ui/vite.config.ts:12, 25` and `ui/react-router.config.ts:6` (build and dev-server config: `PRM_BASE`, `PORT`), `playwright.config.ts`, `docs/docusaurus.config.ts:29`, `e2e/*.ts`, and the vendored library's own `process.env["AUTH_TRUSTED_PROXIES"]` (`ui/vendor/ward/ward-auth.js:5159`, `backend/vendor/ward/ward-auth.js:5159`). The dev scripts load `.env` with Node's `--env-file-if-exists=../.env` (`backend/package.json:8`), not with code, so there is no loader to fail quietly; `config.ts` fails loudly on a missing required variable instead, naming it. `DATABASE_PATH` has **four** copies of one default today; `config.ts` makes it one.

### Every route: 30, by feature, each with its schemas

The vendored plugin's `/auth/*` routes are generated code and out of scope. "New" means the schema doesn't exist in `shared/src` yet; step 6 reads each handler to settle the exact shape. A route declares only the statuses its handler sends (the skills library's Round 8 fact: a declared status the handler doesn't send turns into a 500). The guard's 401 and 403 are not declared.

| Feature | Method and path | params | querystring | body | response |
|---|---|---|---|---|---|
| health (1) | `GET /health` | | | | `200`: new `healthSchema` |
| places (5) | `GET /api/places` | | `placesQuerySchema` | | `200`: new page of `placeSchema`; `400` |
| | `GET /api/places/:id/events` | new `idParamsSchema` | `placeEventsQuerySchema` | | `200`: new page of `eventSchema`; `400`, `404` |
| | `GET /api/places/:id` | `idParamsSchema` | | | `200`: `placeSchema`; `404` |
| | `POST /api/places` (admin) | | | `createPlaceSchema` | `201`: `placeSchema`; `400` |
| | `DELETE /api/places/:id` (admin) | `idParamsSchema` | | | `204`; `404`, `409` |
| events (4) | `GET /api/events` | | the local `eventsQuerySchema` (`events.ts:17`), moved to `shared` | | `200`: new page of `eventSchema`; `400` |
| | `GET /api/events/:id` | `idParamsSchema` | | | `200`: `eventSchema`; `404` |
| | `POST /api/events` (admin) | | | `createEventSchema` | `201`: `eventSchema`; `400` |
| | `DELETE /api/events/:id` (admin) | `idParamsSchema` | | | `204`; `404`, `409` |
| whats-on (1) | `GET /api/whats-on` | | `whatsOnQuerySchema` | | `200`: new page of `whatsOnItemSchema`; `400` |
| archive (2) | `GET /api/archive` | | `archiveQuerySchema` | | `200`: new page of `whatsOnItemSchema`; `400` |
| | `GET /api/archive/mine` | | `archiveQuerySchema` | | `200`: the same; `400` |
| favorites (5) | `GET /api/favorites` | | | | `200`: new `favoritesSchema` (`FavoritesDto`) |
| | `POST /api/favorites/places/:placeId` | new | | | `204`; `404` |
| | `DELETE /api/favorites/places/:placeId` | new | | | `204`; `404` |
| | `POST /api/favorites/events/:eventId` | new | | | `204`; `404` |
| | `DELETE /api/favorites/events/:eventId` | new | | | `204`; `404` |
| notifications (2) | `GET /api/notifications` | | | | `200`: new `inboxSchema` (`InboxDto`) |
| | `POST /api/notifications/read` | | | `markReadSchema` | `200`: new `{ read }`; `400` |
| osm (1) | `POST /api/admin/osm/sync` (admin) | | | `osmSyncRequestSchema` | `200`: `osmSyncResultSchema`; `400`, `409`, `504` |
| ingest (9, all admin) | `GET /api/admin/sources` | | | | `200`: new `{ data: source[] }` |
| | `POST /api/admin/sources` | | | `createSourceSchema` | `201`: new `sourceSchema`; `400`, `409` |
| | `PATCH /api/admin/sources/:id` | new | | new | `200`: `sourceSchema`; `404` |
| | `POST /api/admin/sources/:id/refresh` | new | | | `200`: new refresh result; the `IngestError` statuses |
| | `POST /api/admin/sources/refresh-all` | | | | `200`: new `{ data: result[] }` |
| | `GET /api/admin/staged-events` | | `stagedQuerySchema` | | `200`: new `{ data: staged[] }`; `400` |
| | `POST /api/admin/staged-events/accept` | | | `stagedIdsSchema` | `200`: new; `400` |
| | `POST /api/admin/staged-events/reject` | | | `stagedIdsSchema` | `200`: new; `400` |
| | `POST /api/admin/staged-events/:id/place` | new | | `resolvePlaceSchema` | `200`: new; `400`, `404` |

**`idParamsSchema` stays a plain `{ id: string }`.** The handlers answer an unknown id with 404, as today, so a regex in the schema would turn a 404 into a 400.

**Hand parsing removed:** 14 `safeParse(req.…)` calls in 7 files, none of which the skills library's `.parse(request.` regex finds, because this repo writes `req` and `safeParse`:

- `backend/src/routes/places.ts:76, 138, 187`;
- `backend/src/routes/events.ts:26, 91`;
- `backend/src/routes/whats-on.ts:26`;
- `backend/src/routes/archive.ts:53` (a helper that takes `query`, so it matches neither);
- `backend/src/routes/favorites.ts:120`;
- `backend/src/routes/admin-osm.ts:33`;
- `backend/src/routes/admin-ingest.ts:70, 128, 134, 143, 149`.

`backend/src/ingest/pipeline.ts:166` parses stored rows, not request input, and stays.

### The error plugin

`plugins/errors.ts`, wrapped in `fastify-plugin` and registered first. It **keeps the repo's body, `{ code, message }`**, because the UI client reads only `message` (`ui/app/lib/api.ts:23-30`) and the handlers send `code` (Q43: one handler, the repo's own shape). In order:

1. A schema validation error (`hasZodFastifySchemaValidationErrors`) becomes 400, with `INVALID_QUERY`, `INVALID_BODY` or `INVALID_PARAMS` by the error's validation context, and the first issue's path and message as `message`.
2. An `ApiError(status, code, message)` becomes its status. `IngestError` (`pipeline.ts:53`), `SyncInProgressError` and `OverpassTimeoutError` (`osm-sync.ts:454, 465`) extend it, which replaces the hand-written `fail(reply, err)` (`admin-ingest.ts:43`) and the two `instanceof` branches in `admin-osm.ts:52-55`. The 31 `reply.status(…).send({ code, message })` sites that report an expected 404 or 409 stay as they are: a response schema declares those statuses.
3. `isResponseSerializationError` becomes 500 `INTERNAL`, logged with the method and URL. Never shown.
4. A 4xx Fastify raised itself (a malformed body, a payload too large, an unsupported media type) passes through with its own status and message, and its message is kept only because Fastify wrote it (Q43).
5. Anything else becomes 500 `INTERNAL`, logged, with no detail in the reply. **A thrown error's message is never echoed to the client** (Q43). Today the default handler puts it in the reply, so this closes a leak. A test throws an error with a recognisable message from a route and expects the reply not to contain it.

The not-found handler answers `{ code: "NOT_FOUND", message }`. It isn't rate-limited: `@fastify/rate-limit` is not a dependency, and rule 8 asks for it only where it is present.

### `server.ts`, `app.ts` and the entry file

`server.ts`:

1. `loadConfig()`. A `ConfigError` goes to stderr and exits 1, naming every missing or malformed variable, before any logger exists.
2. `buildApp(config, { logger: true })`, with `connectionTimeout`, `requestTimeout`, `keepAliveTimeout` and `trustProxy` (decision 8).
3. `close-with-grace`, which also closes the SQLite handle (the app does not close it today; the test harness does).
4. `listen({ host, port })`, then `startReminderSweep`, where `index.ts` starts it now. The comment at `index.ts:19-22` stays: it is why the sweep is not in `buildApp`.

`app.ts` registers in a fixed order: the errors plugin; the provider's compilers; `plugins/auth` (before every route: the library's guard is a root `onRequest` hook that Fastify copies into a child only when the child is created); then the features by name, each with the shared context as its options.

**Renaming the entry moves the built file** from `backend/dist/index.js` to `backend/dist/server.js`. These name it:

- `infrastructure/Dockerfile:74`: `CMD ["node", "backend/dist/index.js"]`;
- `backend/package.json:6` (`main`), `:8` (`dev`: `tsx watch … src/index.ts`) and `:10` (`start`).

No other file names it (`grep -rn "dist/index" --include=*.json --include=*.ts --include=*.yml --include=*.md . | grep -v node_modules` finds only those). The compose file starts the image's `CMD`, and the `prm-migrate` service uses `db/migrate.ts`, which doesn't move.

### Test impact

- 26 test files, on vitest: 15 call `inject(`, 17 build the app through `buildTestApp`. Moved tests need their relative imports updated (`../test/harness.js` becomes `../../test/harness.js`).
- No test changes its assertions, apart from `harness.ts`'s `signIn`, which stops reading `app.auth` (decision 2).
- New tests:
  - one per validation context asserting the 400 code and `message` (step 1 adds them before the zod move, so they run on both versions);
  - a field added to a row is stripped from a reply;
  - a reply that fails its response schema is a 500 `INTERNAL` with no detail;
  - a thrown error never shows its message;
  - the not-found handler;
  - a `.default()` field (`event.status`, `place.source`) round-trips through its response schema.
- Baseline: 172 backend tests in 26 files, 38 in `shared`, passing on 2026-11-10.

## Owner decisions (defaults this brief builds)

1. **`features/<name>/`** (Q23). Decided 2026-11-10 (technical call): yes, as in the move map, under `backend/src/`. The directory is not renamed to `server/` (see the move map).
2. **Typed plugin options and explicit registration** (Q24, Q56). Decided 2026-11-10 (technical call): an `AppContext` built in `app.ts` (`db`, `notifyMail`, the ingest and OSM dependencies) is passed to each feature plugin as its typed options, and registration is explicit. The three decorators and the `declare module "fastify"` go: no decorators as a test seam, so tests pass their dependencies as plugin options. `auth` goes with them: `buildTestApp` builds its own accounts from its `sqlite` handle, as `db/accounts-cli.ts` does. One `ApiError` class stays (Q56), and a feature's CLI may live beside it.
3. **A response schema on every route** (Q25, Q53). Decided 2026-11-10 (technical call): yes. No route sends pass-through JSON. Stream and binary routes are exempt, each with a `scripts/conventions.json` entry. A check of `backend/src/routes` (no `.type(`, `createReadStream`, `Buffer`, `sendFile` or `.raw` in non-test code, 2026-11-10) found none, so no entry is expected.
4. **`NODE_ENV`.** The structure says `config.ts` does not read it. Three places use it, and one of them is a legal safeguard: `ingest/pipeline.ts:43` refuses the iaBilet adapter in production ([wiki/decisions.md](../../wiki/decisions.md), "Legal posture"; the Dockerfile sets `NODE_ENV=production`). Decided 2026-11-10 (technical call, the checkers' config-read rule): `config.ts` reads it once, as `config.production`, and this is allowed as an exception recorded in `scripts/conventions.json` with that reason. The alternative is a purpose-named variable the Dockerfile sets, which would leave the safeguard off in any environment that forgets it. [Brief 01](01-a-source-registry-and-shareable-map-links.md), if built, replaces this use with the registry's `forbidden` state (the only state it keeps off the map), and the exception can go.
5. **The entry file** (Q1, a fact found 2026-11-10). Rename to `server.ts`, and change the Dockerfile's `CMD` and the three `package.json` lines in the same commit.
6. **The test runner** (Q27). Decided 2026-11-10 (technical call): vitest stays (only atrium stays on `node:test`).
7. **The error body** (Q43). Decided 2026-11-10 (technical call): one error handler, keeping `{ code, message }`. It passes Fastify's own 4xx through and never echoes a thrown message. Validation runs before authorisation (Q52, accepted).
8. **Timeouts and proxy.** Defaults (no question covers them):
   - `requestTimeout: 180_000` and `connectionTimeout: 180_000`. Two routes run long: `POST /api/admin/osm/sync` waits up to `OVERPASS_HTTP_TIMEOUT_MS` = 100 s (`osm-sync.ts:78`), and `POST /api/admin/sources/refresh-all` runs the sources one after another, each with a 15 s fetch (`ingest/adapters.ts:58`) and a geocoder paced at one request a second (`ingest/geocode.ts:91`). A short global `connectionTimeout` would cut both (the skills library's Round 8 fact, from its other servers' long polls). Check the deploy's Caddy snippet for its own upstream timeout: if it is shorter, that is an owner step with the exact edit;
   - `keepAliveTimeout: 125_000`, above Caddy's default idle keep-alive to its upstream, so the API never closes a connection Caddy is about to reuse;
   - `trustProxy`: the address Caddy's requests come from inside the container. Compose publishes the port on loopback (`infrastructure/docker-compose.yml:10`), so the source address is probably the Docker bridge gateway, not `127.0.0.1`. Step 2 prints `request.ip` from a running container and sets the real value, with `AUTH_TRUSTED_PROXIES` as the one list. The library's own login lockout reads the socket itself, so this doesn't change it.
9. **Logging and Fastify 5.12.8.** Default (no question covers it): JSON as today, no `pino-pretty`; no Fastify bump in this brief.
10. **Stores** (Q54). Decided 2026-11-10 (technical call): a big `store.ts` stays whole in `db/`; no stores are extracted in this brief (see the move map).
11. **Where zod schemas live** (Q55). Decided 2026-11-10 (technical call): a schema lives in `shared/` when the client imports it, otherwise in its feature folder. The existing ones in `shared/src/types/` stay (the UI imports them); a new response schema that only the server uses goes in its feature folder.

## Files you OWN

- `backend/src/**`: the moves, `config.ts`, the new plugins, the schemas wired in.
- `backend/package.json` (scripts, `main`, the zod move, the new dependencies pinned: `@fastify/type-provider-zod`, `@fastify/swagger`, `openapi-types`, `fastify-plugin`, `close-with-grace`), `shared/package.json` (zod), `package-lock.json`.
- `shared/src/**`: the new response and params schemas, the local `eventsQuerySchema` moved in, each with a test. Input schemas don't change.
- `backend/vitest.config.ts` only if the test include no longer matches (`src/**/*.test.ts` still matches nested folders).
- `infrastructure/Dockerfile`: the `CMD` line.
- The root `package.json`: `check:conventions` (dependency-cruiser added, `check-structure`'s `--warn-only` dropped).
- `.dependency-cruiser.cjs` (new, from the skill's preset), and `eslint.config.js` (`n/no-process-env` from warning to error).
- `scripts/conventions.json`: the exceptions (decision 4, the `backend/` and `test/` names).
- `.claude/rules/backend.md`: the structure lines.
- `.env.example`: only if a variable's default or requiredness changes (`PUBLIC_ORIGIN` becomes required everywhere).
- Corpus: [wiki/architecture.md](../../wiki/architecture.md) (the file map and the route table), [wiki/decisions-engineering.md](../../wiki/decisions-engineering.md), [wiki/decisions-identity.md](../../wiki/decisions-identity.md) (its `backend/src/ward/` references, lines 70, 107 and 118), [wiki/status.md](../../wiki/status.md), [log.md](../../log.md).

## Files you must NOT touch

- `ui/`. A response schema that drops a field the UI reads is a finding: fix the schema, not the UI.
- `shared/` input schemas and their behaviour.
- `backend/vendor/`: generated.
- The deploy beyond the Dockerfile's `CMD` line. A Caddy or vps-deploy edit is handed to the owner as exact commands.
- Behaviour: status codes, error codes, the public route list, and every route's JSON apart from fields the comparison shows were leaks.
- The iaBilet rule: it keeps refusing the adapter in production until brief 01 replaces it.

## What to do

Follow `migrating-a-server.md`. One commit per step; after each, `npm run check` and `npm run build` pass, and `npm start -w backend` serves `GET /health`.

1. **Before.**
   - Run `check-structure` strict and record its counts by rule.
   - Add the validation-context tests (a 400 per context, asserting `code` and `message`), and commit them alone, green on zod 3.
   - Seed a scratch database (`DATABASE_PATH` pointing at a temp file, `npm run db:migrate -w backend`, `npm run db:seed -w backend`). With a throwaway script that is not committed, save the JSON of every route above (the public ones anonymous, the rest signed in as an admin), with fixed query parameters.
2. **zod 4, `config.ts` and the split.**
   - Move `zod` to 4.6.7 in `shared` and `backend`; keep `npm run typecheck` and `npm test` green. Check the UI build's size before and after.
   - Add `config.ts`, with `loadConfig(env = process.env)` and `loadSeedConfig()`, and point every reader in the table at it. `index.ts` becomes `server.ts`, with the entry-file changes (decision 5), `close-with-grace`, and the timeouts. Print `request.ip` from the built container behind the compose port mapping and set `trustProxy`.
   - Make `n/no-process-env` an error.
3. **The error plugin** and `ApiError`. Every existing test passes unchanged.
4. **Feature folders.** `git mv` file by file per the map, so history follows. Add the `index.ts` files and `plugins/auth/index.ts`. Add `.dependency-cruiser.cjs`, and check that a deliberate import of `features/events/mapper.js` from `features/places/` fails it.
5. **The context instead of decorators.** Build `AppContext` in `app.ts`, pass it to each feature, drop the decorators and `declare module "fastify"`, and update `buildTestApp`.
6. **The type provider and the schemas, one feature per commit:** health, favorites, notifications, archive, whats-on, events, places, osm, ingest. Each commit:
   - declares params, querystring, body and response;
   - removes that feature's `safeParse(req.…)`;
   - types the plugin as `FastifyPluginAsyncZod<AppContext>`;
   - adds the new tests that apply.

   Response schemas strip unknown fields, so compare each route's JSON with step 1's before moving on.
7. **After.** Save the same JSON again and diff it against step 1's. A field that disappeared is a leak (keep it dropped and list it) or a missing schema field (add it). Put the diff's summary in the `log.md` entry.
8. **Strict.** Drop `check-structure`'s `--warn-only`, and make dependency-cruiser part of `check:conventions`.
9. **Corpus.**
   - Add an entry to [wiki/decisions-engineering.md](../../wiki/decisions-engineering.md) adopting the structure, with what was rejected (a `server/` rename, autoload, TypeBox, extracting stores now) and why.
   - Update the pages listed under Files you OWN and `.claude/rules/backend.md`, and run `bash corpus/lint.sh` until it is clean.

## Acceptance

- [ ] `check-structure` passes **strict**, with any exception in `scripts/conventions.json` and its reason. Its counts before and after are in the outcome note, for the skills library's brief 16 table.
- [ ] `grep -rnE "\.(safe)?[pP]arse\(req" backend/src --include=*.ts | grep -v "\.test\.ts"` prints nothing, and every route in the table has a `schema` with a `response` where it has a body to send.
- [ ] `grep -rn "process\.env" backend/src --include=*.ts | grep -v "\.test\.ts"` prints only `config.ts`, and `n/no-process-env` is an error.
- [ ] `grep -rn "decorate(\|declare module \"fastify\"" backend/src --include=*.ts | grep -v "\.test\.ts"` prints nothing (Q56 keeps none).
- [ ] The validation-context tests, the stripped-field test, the serialization-500 test, the thrown-error test (the reply never contains the thrown message, and a Fastify 4xx such as a malformed JSON body keeps its own status), the not-found test and the `.default()` test pass, along with every existing test unchanged.
- [ ] The before and after JSON comparison is in `log.md`, with every dropped field named.
- [ ] `npm run build` writes `backend/dist/server.js`. `docker build -f infrastructure/Dockerfile .` succeeds, and the container answers `GET /health` through its health check. A start with `PUBLIC_ORIGIN` unset exits 1 and names it.
- [ ] dependency-cruiser fails on a deliberate cross-feature import and passes clean.
- [ ] `npm run test` passes at 234 tests or more (plus the new ones), `npx playwright test` at 30 or more, and `npm run check` passes.
- [ ] `bash corpus/lint.sh` ends clean.

## Interplay

- [Brief 01](01-a-source-registry-and-shareable-map-links.md) adds `shared/src/sources.ts` and edits `backend/src/ingest/adapters.ts` and `pipeline.ts`. Run it after this brief, so it edits `features/ingest/`. If it must go first, this brief's move map applies to the files as 01 leaves them, and its `NODE_ENV` exception (decision 4) is already unnecessary.
- Brief 01's source registry does not gate publishing (owner, 2026-11-10): a source with pending permission is shown and credited, and taken off if the site objects; only a `forbidden` source stays off. So the registry's check replaces only the iaBilet use of `NODE_ENV` in decision 4, and nothing else here changes.
- [Brief 03](03-the-house-style-harness.md) turned `n/no-process-env` on as a warning and removed the 58 redundant `await`s. This brief makes the rule an error and adds dependency-cruiser.
- [Brief 04](04-base-ui-by-the-conventions.md) touches `ui/` only. Both change `package-lock.json`, so run them one at a time.
- The skills library should hear about three things before the other servers run its brief 16: the `.parse(request.` regex misses `safeParse(req.…)` and helper parsing (14 sites here), a server with no error handler leaks a thrown error's message, and the checkers assume `server/` and `web/` where this repo has `backend/` and `ui/` (with `ui/app/` as the source folder).
