# Log

## [2026-10-04] maintenance | decisions.md split; a done brief left as it was

decisions.md had grown to 302 lines, past the corpus's ~200-line rule. Three groups moved unchanged into decisions-identity.md, decisions-ui.md and decisions-engineering.md, with a pointer left behind and wiki links updated. Separately, an addendum appended to the done brief 08 was taken back out, because done briefs are immutable here. Its content (the city-limits recapture) is in this log and status.md.

## [2026-10-04] research | A shortlist of event sources

As the owner asked, the obvious public venues in both cities were probed for feeds ([todo](todos/2026-10-04-source-shortlist.md)). There are two real iCal feeds the built-in adapter reads with no problems: Filarmonica Banatul (30 events) and Teatrul Național Timișoara (27). Several sites have RSS (news, not events), and no București venue among 18 has a feed. Nothing was added; the terms and the choice are the owner's.

## [2026-10-04] change | Signed-in e2e, through a fake Ward

As the owner decided, the e2e stack now starts a stand-in Ward (`e2e/fake-ward/server.ts`). It serves a JWKS and `/introspect` behind prm's app key, plus a test-only sign-in that mints real EdDSA tokens. Specs set the token as `ward_session`, and the backend verifies and introspects it exactly as it does with Ward. Six new specs: the demo user's bell (now seeded in e2e as `e2e-demo`), following and unfollowing, the admin queue and sources, "no access" without the grant (the case TP-05 could not walk by hand), and the signed-in archive. e2e 26, tests 176.

## [2026-10-04] change | The OSM sync stops at the city limits

As the owner decided, the sync queries inside each city's administrative boundary (an Overpass area from its OSM relation) instead of a bounding box. The bounding box stays only as the cheap plausibility check for geocoding and manual pins. The fixture was recaptured: 2,449 places, down from 2,676, with Giroc, Dumbrăvița, Bragadiru and the other neighbours gone. Tests: 176, e2e 20.

## [2026-10-04] decide | Owner answers after briefs 08 and 10

Recorded in decisions.md. The data contact is a placeholder (`johndoe@example.com`) until the owner sets a real one. Notifications stay in-app only. Signed-in e2e gets a fake Ward. Cities are clipped to their municipal boundary. The phone sheet keeps two snaps. Past events are never pruned. The run researches a shortlist of sources for the owner to vet. Brief 29's table shape and brief 15's hand-rolled drawing are confirmed. Separately, Ward's sign-out bug (TP-05's failure) was fixed in Ward.

## [2026-10-04] done | Brief 10 — test plans for the place-centric app, and a run

The seven plans (map, what's on, place, UI audit, sign-in, favourites, admin ingestion) name the automated test behind each case or mark it manual. The run walked the manual ones against the local Ward. It found and fixed six bugs: pins had no accessible name, Enter on a pin did nothing, Log in returned to the map instead of the page, a wrapped row left a dangling "·", the review drawer's candidate buttons were indistinguishable, and the iCal category guesser read "matched" as Sport. TP-05 fails on Ward's side: its Sign out does not end the session. The old "auth internals" suite is obsolete, since prm hashes nothing and issues no tokens.

## [2026-10-04] done | Brief 08 — the seed is a frozen OSM sync with stable ids

`db:seed` now resets the database and loads a committed capture of the real OSM sync for both cities: 2,676 places, offline and the same every run. `npm run db:capture-osm` refreshes the capture. One event venue OSM lacks (Piața Victoriei) and the 15 synthetic events sit on top. Every row has a name-based id, so the e2e specs fetch rows by id. `SEED_DEMO_SUBJECT` gives a Ward subject favourites and a bell item. Real curated events were dropped, since they would go stale in days and real events come through 04. Found: the city bboxes take in neighbouring towns.

## [2026-10-03] done | Brief 14 — the archive

`/archive` lists what happened, newest first and grouped by month, each event still opening its place. There is a public tab for the city and a signed-in tab of your saved events plus those at places you follow. "Past" is computed beside the live window from the same columns, so an event leaves what's on exactly when it enters the archive; cancelled and stale events never appear. The prune decisions.md mentions does not exist yet.

## [2026-10-03] done | Brief 05 — favourites, the bell, and day-before reminders (in-app)

People can follow a place and ask to be reminded of an event. Signed out, the star sends them through Ward and completes the favourite on the way back. Accepting events now gives each follower of the place one item per batch, and a sweep (at startup, then 09:00 Bucharest) writes a reminder for every favourited event starting the next Bucharest day, idempotently. The bell lists both and marks them read when opened. All of it was walked against the local Ward. **Email is blocked:** prm holds no addresses since the cutover, so sending needs a Ward-side change (decisions.md).

## [2026-10-03] done | Brief 29 — the migrated schema is schema.ts again

`notification_event` is keyed on (notification, event) with a cascade from its notification. That is the shape 0001 deployed, and `schema.ts` now says so; the call was taken by the brief run and is recorded in decisions.md for the owner. Migration 0003 adds the two favourite indexes 0001 never created. A new test builds one database from the migrations and one from `schema.ts` and compares them table by table. It caught this brief's drift, and one in brief 04's 0002 (column order). The real dev database is still at migration 0000.

## [2026-10-03] done | Brief 16 — the admin shell and the review queue

`/admin` has its own sidebar shell, split from the public bundle and gated on `prm:admin`. The review queue puts what needs judgement first, pre-selects what is plainly fine, and bulk-accepts or rejects. A drawer per row shows a mini map, the match candidates and a manual pin. The sources page shows health (suspect is loud), refreshes one or all, adds an iCal source, and runs the OSM sync. Walked by hand against the local Ward: a local feed went from refresh to a public event, and an unmatched venue became a manual-pin place.

## [2026-10-03] done | Brief 04 — the event ingestion pipeline (no source yet)

An admin adds a source, refreshes it, and gets a staged diff, with nothing public until accepted. The steps: validate (malformed rows quarantined), dedup within and across sources, match the venue to a place (auto, ambiguous with candidates, or unmatched), geocode only the unmatched (Nominatim at 1 req/s, cached forever, sanity-checked, off without an identifying User-Agent), and reconcile with what is live (start/venue/cancellation back to review; price and links silently; absent past 3 days means stale). Health is ok, suspect or error. The built-in adapter is a generic iCal reader, so a vetted feed is a database row, not code; no iaBilet adapter exists. Migration 0002 adds four staged-event columns. 45 new tests. Choosing and vetting real sources is the owner's: see the 2026-10-03 todo.

## [2026-10-03] done | Brief 13 — the last public interactions

Zero results now offers every active filter back as its own removable chip, with a hint for what dropping the area or the search would show. A banner states the timing lens and has a Show all. Other pins dim while a place is open, and on a phone the attribution folds behind a tappable "i". Five e2e specs cover them. Kept as is: the sheet's two snaps (a design call). Gone: `/verify` and `/reset` (Ward's now). Favorites and the bell move to brief 05.

## [2026-10-03] done | Brief 17 — a Playwright e2e suite that boots its own stack

`npm run test:e2e` starts its own API and UI on separate ports, against a database migrated and seeded fresh each run. It mocks Timișoara geolocation and runs nine specs over the map, what's on, place deep links, attribution and draw-to-filter, using real mouse input. Its first run caught a bug from brief 15: while drawing, a polygon corner on a pin opened that place, because Leaflet re-enables pointer events per icon. Signed-in e2e waits on a decision (a fake Ward or the local container), and the favorites and admin specs come with their features.

## [2026-10-03] check | Brief 27's image build, now that Docker is available

`docker compose -f infrastructure/docker-compose.yml build prm-api` succeeds (287 MB), and the image has no `argon2`, `@fastify/cookie` or `@react-router/serve`. Brief 27's one unverified acceptance item is closed.

## [2026-10-03] done | Brief 09 — attribution, an about-the-data page, and per-event source credit

The map credits `© OpenStreetMap contributors` (it said `© OpenStreetMap`) and links "About the data", a new page with the licences, the link-out posture, the iaBilet disclaimer and the removal path. Every event now names its publisher, linked to the original listing in the place panel. **The takedown address is owed:** set `VITE_DATA_CONTACT` before launch. The page says plainly that today's events are samples, a callout to remove when brief 04 lands.

## [2026-10-03] done | Brief 12 — the database connection settings, and the rest closed

The connection now also sets `synchronous = NORMAL` and a 5 s `busy_timeout`; a test reads all four pragmas back and checks that the city and lat/lng filters use their indexes. The brief's "fetch by viewport bbox" is superseded by whole-city loading (briefs 20, 13, 15), clustering already shipped with brief 13, and canvas markers and batching stay behind a slowdown nobody has measured.

## [2026-10-03] done | Brief 15 — draw an area to filter the map and what's-on

A drawn area (freehand or polygon) now ANDs with chips, the timing lens and search, on the map and on what's-on. It is cleared, with a notice, when the city changes. **The locked Geoman choice did not survive contact:** free Geoman has no freehand (Pro-only), so both modes are hand-rolled on Leaflet and no draw plugin or turf was installed. decisions.md records the revision. `ui` gained its first Vitest project, for the point-in-polygon helper. Browser-checked on desktop with a reseeded scratch DB; a phone and a real touch stroke are still unchecked.

## [2026-10-03] done | Brief 28 — SPA-template leftovers out, every manifest exact-pinned

`@react-router/serve` is gone from `ui`, and with it `express` and its whole tree (`npm ls @react-router/serve express` is empty). **`start` was replaced, not dropped:** it is now `vite preview --outDir build/client`, with the root `.env` loaded. It serves the SPA under `/prm/` with deep-link fallback (`/prm/places/abc` → 200, index.html), and `preview.proxy` inherits the dev `/prm-api` proxy, so it is a working local preview once the backend runs. `ui/Dockerfile` and `ui/components.json` were deleted (no references), and `ui/README.md` (the template's) now describes how this UI runs and ships.

Pins: `jose` is `6.2.10`; docs deps are their installed versions (starlight 0.41.11, archivo 5.3.0, astro 7.3.1, sharp 0.35.4, typedoc 0.28.20). No `^`/`~` remains in any manifest.

**The docs `cookie` workaround is removed.** After the reinstall the repo root hoists no `cookie` at all. Express's 0.7.2 went with `@react-router/serve`, and Fastify's `light-my-request` keeps its `cookie@1.1.1` nested. With the devDependency and the `//cookie` note deleted, `npm run docs -w @prm/docs-site` built 14 pages clean.

`npm run build`, typecheck, tests (104 + 3 todo) and the docs build are all green. `npm run dev` serves 200 on :5173. **The audit sweep 18–28 is complete**; 29 (from brief 23) remains.

## [2026-10-03] done | Brief 27 — the Ward cutover's leftovers are gone

Re-grepped each item first; none had an importer. Removed:
- `argon2` and `@fastify/cookie` (`npm uninstall -w @public-resource-map/backend`). The lockfile lost exactly their trees: argon2, `@phc/format`, `node-addon-api`, `node-gyp-build`, and `cross-env` with its `cross-spawn`/`which`/`isexe`/`path-key`/`shebang-*` chain; `@fastify/cookie` and its nested `cookie`. `npm ls argon2 @fastify/cookie` is empty.
- `ui/app/components/shell/AuthCard.tsx`.
- 19 dead `auth.*` keys in each language (only `auth.unavailable` is live).
- `shared/src/types/auth.ts` and its barrel re-export.

That file described itself as a deliberate signpost; its explanation already lives in decisions.md → Identity is Ward's. `tsc` leaves stale outputs, so the four `shared/dist/types/auth.*` files were deleted by hand (dist is gitignored).

typecheck, tests (104 + 3 todo) and `npm run build` are green. **The API image build was not run: Docker is unavailable** (WSL integration off). In the browser on the dev stack, the Navbar account menu opens with Autentificare / Cont nou, and no raw i18n key appears on the page. status.md's Auth row, which still described argon2 and `prm_session`, now says Ward, and a row tracks the audit sweep.

## [2026-10-03] done | Brief 26 — prm's real Ward client has a test suite

`ward.client.test.ts` grows from brief 21's 4 cases to 30, ported from Ward's reference suites and run entirely through the injected fetch, with real EdDSA keys and `SignJWT` tokens:

- **verify:** a valid token passes. Rejected: `alg: none`, HS256 keyed with the public key's bytes, wrong `iss`, wrong `aud`, missing `sid`, and expired 30s ago. Accepted: expired 2s ago, within the 5s tolerance.
- **introspect:** active → session; inactive → `{active:false}`; 401 → `WardConfigurationError`; 500 → unavailable (and not the config subclass); non-JSON → unavailable; active without subject → unavailable; a request that never answers, with a 20ms timeout → unavailable.
- **cache:** driven by the `now` option with no sleeps. A repeat inside 30s is one fetch, a call after 30s is a second, two tokens are two fetches, and three concurrent calls for a cold token are one.
- **cookie:** absent header, cleared `ward_session=`, among several cookies, an array header, and look-alike names.
- **authenticate:** an inactive session is an authentication error, and the `x-ward-app-key` header is sent.

`test/real-ward.ts` handlers now receive the request init, for the abort signal and the headers.

**Sanity checks, both restored afterwards.** TTL raised to 60s: "asks Ward again once 30 seconds have passed" fails. `algorithms` removed: the `alg: none` and HS256 tests fail, but **not because the token is accepted**. Without the pin, jose's key set throws on the unknown alg *inside the key resolver*, and brief 21's wrapper reports that as `WardUnavailableError("jwks unavailable")`, a 503 instead of a 401. With the pin (as shipped), jose rejects a disallowed alg before the resolver runs, so this cannot happen today. As defence in depth, the resolver wrapper could treat any failure on a token whose header `alg` is not `EdDSA` as an authentication error. Not changed here, because the brief forbids touching `ward.client.ts`; raised in the run summary. Tests 104 pass + 3 todo, and typecheck is clean.

## [2026-10-03] done | Brief 25 — OSM sync imports public healthcare only

The bare `{ key: "healthcare" }` rule is now `healthcare=hospital|clinic|centre`, in the same priority position. The Overpass filter follows, since it is derived from the rules. Tests: no bare `["healthcare"]` filter; a pharmacy (`amenity=pharmacy` + `healthcare=pharmacy`) and a dentist map to `other`; `healthcare=hospital` maps to `clinic`. `osm-sync.test.ts` had the old bare filter as its example relation line and was updated to the new one. Tests 78 pass + 3 todo, and typecheck is clean.

**Counts** (one Overpass `out count` query per city, app bboxes, named elements only, 2026-10-03):

| City | Before (bare `healthcare`) | After | Named `sport=*` | …of which `leisure=fitness_centre` | …with a `shop` tag |
|---|---|---|---|---|---|
| București | 3,177 | **2,178** | 286 | 26 | 10 |
| Timișoara | 719 | **521** | 53 | 3 | 0 |

București's "before" was 3,171 on 2026-09-27; OSM moved. The bare `sport` rule is kept: about 12% of its București matches are gyms or shops, a small and mostly sports-relevant share, and changing it is a separate call per the brief. București is still over 1,000 places, which brief 20 now handles.

**Already-synced databases keep their old rows** (the sync never retires). The local `backend/data/app.db` holds only seed rows (no `osm_id`), and no deployed DB was checked. For any environment that has synced, the one-off is: note `T = datetime('now')`, re-run `POST /api/admin/osm/sync` for the city, then delete that city's unprotected OSM rows the sync did not touch (every in-scope row gets `updated_at` bumped) and that nothing references:

```sql
DELETE FROM place
WHERE source = 'osm' AND is_manual_pin = 0 AND osm_id IS NOT NULL
  AND city = :city AND updated_at < :T
  AND id NOT IN (SELECT place_id FROM event WHERE place_id IS NOT NULL)
  AND id NOT IN (SELECT place_id FROM staged_event WHERE place_id IS NOT NULL)
  AND id NOT IN (SELECT place_id FROM favorite_place)
  AND id NOT IN (SELECT place_id FROM notification WHERE place_id IS NOT NULL);
```

Not run anywhere: it needs the owner's go-ahead per environment.

## [2026-10-03] done | Brief 24 — a shared place link adopts the place's city

**Reproduced first** (dev stack on a freshly migrated and seeded scratch DB, headless Chrome, empty localStorage): `/prm/places/<MNAR id>` showed the panel and flew to București, but the picker said Timișoara, the count read Timișoara's "23 de locuri", and no app pin was on the map.

Fix: a new store action `adoptCity` switches city without clearing the selection and persists it like `setCity`. Persisting is also what stops `hydrateCity` from undoing it, since hydration reads back the adopted city. The place route adopts `cityByName(place.city)` when it differs. `CityRecenter` skips while a place is selected, read at effect time so closing the panel does not recentre either. Navbar's `hydrateCity` effect needed no change.

Checked in the browser:
- **Fresh profile, București link:** picker București, 15 places, pin highlighted, centred on the museum.
- **Closing the panel:** still București with its pins.
- **Stored București, Timișoara link:** ends on Timișoara, centred on the museum, no jump.
- **City picker with nothing selected:** recentres on the city as before.
- **Pin click:** opens its panel.

Typecheck clean; tests unchanged (77 + 3 todo). There is no UI test harness, so nothing automated covers this; brief 17 (e2e) is where it belongs.

The same session cleared brief 19's owed demo check: the seeded exhibition shows under **AZI** with "până pe 12 nov." in MNAR's panel and in what's-on.

## [2026-10-03] done | Brief 23 — 0001 has a drizzle snapshot; found that 0001 drifted from schema.ts

`backend/drizzle/meta/0001_snapshot.json` now exists, chained to 0000 (`prevId` `a0ad6566-…`). It was produced by running `drizzle-kit generate` from `schema.ts` into an empty scratch `out`, which gives a full-schema snapshot without prompts, and then re-chaining its ids. On a scratch copy of the repo's `drizzle/`:

```
No schema changes, nothing to migrate 😴
```

`db:migrate` on an empty scratch DB succeeds. The new `backend/src/db/migrations.test.ts` checks that every journal entry has a snapshot and that the `prevId` chain holds, and it fails with the snapshot removed. Tests 77 pass + 3 todo, and typecheck is clean.

**Found on the way, filed as brief 29:** the hand-written 0001 does not build what `schema.ts` says. Comparing an empty DB migrated through 0000+0001 with one built from `schema.ts` showed that `notification_event` lacks `id` (composite PK, cascade), that `favorite_place_place_idx` and `favorite_event_event_idx` are missing, and that `created_at` defaults differ cosmetically. Nothing writes those tables yet, but brief 05's first insert would fail on every deployed DB. The snapshot follows `schema.ts`, so drizzle-kit will not emit the fix by itself.

## [2026-10-03] done | Brief 21 — a Ward key-set failure answers 503, not "signed out"

`verify()` wrapped every `jwtVerify` failure as `WardAuthenticationError`, including a failure to fetch Ward's JWKS. `jose` re-fetches the key set once it is older than 10 minutes or empty. So after ten minutes of Ward being down, or right after a restart, `/api/me` told signed-in people they were signed out, admin routes answered 401 instead of 503, and nothing was logged. The key resolver handed to `jwtVerify` is now wrapped. Any resolver error other than `JWKSNoMatchingKey`/`JWKSMultipleMatchingKeys` becomes `WardUnavailableError("jwks unavailable")`, and `verify()` rethrows it unchanged. The injected `fetch` now reaches the key set through `jose`'s `customFetch`, so the path is testable.

New `ward.client.test.ts` (real EdDSA keys, Ward served from the injected fetch): a JWKS fetch that throws gives 503-class, a JWKS 500 gives 503-class, a valid token resolves, and a foreign key stays a 401-class error. New `ward.plugin.api.test.ts` through `buildApp` with the JWKS failing: `/api/me` 503 `IDENTITY_UNAVAILABLE`, `/api/places` 200, admin sync 503. With the client change reverted, 3 of 4 client tests and 2 of 3 plugin tests fail. The shared key/token/fetch helpers live in `backend/src/test/real-ward.ts`, not in a test file, so both suites (and brief 26) can import them without re-running each other. Tests 75 pass + 3 todo, and typecheck is clean.

**For the Ward owner:** Ward's reference client (`wzd_auth/client/src/verify.ts`) has the same catch-all. It is not fixed here, by the brief's rule.

## [2026-10-03] done | Brief 20 — the map loads every place, not the first 1000

The map took one 1000-row page as the whole city, and `GET /api/places` had no `ORDER BY`. After a real București sync (3,171 named places, measured 2026-09-27), two thirds of the pins would have vanished silently, from the map and from search, and the label would have said "1000 places". `usePlaces` now calls a new `fetchAllPlaces`, which fetches page 1 and then the rest in parallel, capped at 10 pages with a console warning past it. The list query orders by `place.id`, and what's-on breaks start-date ties on `event.id`.

`paging.api.test.ts` (1,050 places): two pages are disjoint and complete, the order repeats, and rows are sorted by id across the boundary. The last assertion is beyond the brief: its repeatability check alone passes without the ORDER BY, because SQLite's plain scan follows insertion order. Confirmed by removing the ORDER BY: only the sorted-order test fails. Tests 68 pass + 3 todo, and typecheck is clean. The manual map check on a scratch DB is still owed.

## [2026-10-03] done | Brief 19 — running events stay visible until they end

Every user surface used to ask "does the event *start* inside the lens window?", and every window starts at now, so an event disappeared from the pin badge, the lens filter, the place panel and what's-on the minute it began. A three-month exhibition was invisible for its whole run. Now all of them call one predicate, `liveInWindow(from, to)` in `backend/src/routes/event-window.ts`: `live AND start <= to AND coalesce(end, start) >= from`. A null end date is deliberately a point event, so it behaves exactly as before.

UI: `groupFor`/`groupByDay` take the end date, a running event sorts under **Today**, and its row shows "până pe {date}" / "until {date}" instead of the start time (place panel and what's-on). The seed gains one running exhibition at MNAR (-14 → +40 days). Every other seed event has a null end, which is how the bug hid.

New `in-progress.api.test.ts`: a running exhibition is counted under all/today/weekend, survives the today hard-filter, and is listed by the panel and by what's-on. An event that ended yesterday, a null-end event that started a minute ago, and one 100 days out are all excluded. `npm test` 65 pass + 3 todo, and typecheck is clean. The demo check in a browser is still owed. index.md also had brief 18 still as todo; that is fixed.

## [2026-10-03] done | Brief 18 — the place and event write routes are admin-only

`POST /api/places`, `DELETE /api/places/:id`, `POST /api/events` and `DELETE /api/events/:id` now carry `{ preHandler: app.requireAdmin }`, the same shape as the OSM sync route. Before this, anyone on the internet could delete every place without events, or publish an event straight to `live`, past the review gate, with a "Buy tickets" link on the trusted origin. The routes are kept as the brief decided, as a curl escape hatch until brief 16's admin UI.

Deleting a still-referenced row is a **409** (`PLACE_IN_USE` / `EVENT_IN_USE`) instead of the FK error escaping as a 500. **Method chosen:** catch `SQLITE_CONSTRAINT_FOREIGNKEY` (new `backend/src/lib/fk.ts` walks Drizzle's cause chain) rather than checking each referencing table first. That covers every referencing table, present and future, and has no check-then-delete race.

New `backend/src/routes/writes.api.test.ts`: on each of the four routes, anonymous gets 401, `prm:user` 403, an unavailable Ward 503, and `prm:admin` 201/204. Deleting a place that has an event gets 409 and the place is still there. `npm test` 59 pass + 3 todo, and `npm run typecheck` is clean. The architecture.md API table, which still listed the pre-reframe `/api/resources` routes, now lists the real routes and their guards.

## [2026-09-27] done | Brief 22 — a fresh clone boots, and local dev signs in through a local Ward

Both dev scripts now load the repo-root `.env`: the backend through `tsx watch --env-file-if-exists=../.env` (tsx forwards the flag), the UI through `node --env-file-if-exists=../.env` in front of the react-router CLI, since Node refuses the flag in `NODE_OPTIONS`. A missing `.env` still ends in `config.ts`'s own `WARD_PUBLIC_ORIGIN is not set` error. New `.env.example` lists every variable the code reads; README has a Getting started; status.md's seed comment no longer says NYC.

Beyond the brief, on the owner's call: local dev is now laid out like the deploy. `.env` sets `PRM_BASE=/prm/` and `VITE_API_URL=/prm-api`, and the UI dev server proxies `/prm-api` to the backend (prefix stripped, as Caddy's `handle_path` does) and `/ward` + `/ward-api` to `WARD_PUBLIC_ORIGIN`, the local Ward container in `wzd_auth/infrastructure/local`. Ward's `?next=/prm/`, its cookie and its same-origin check on `/refresh` and `/logout` then behave as in the deploy; the proxy rewrites `Origin` only for requests from a page on the dev server itself. Production builds are unaffected: the deploy still passes `PRM_BASE` and `VITE_API_URL` itself, and `server.proxy` only exists in dev.

Verified in a headless browser against the local Ward on a scratch database: the navbar's Autentificare opened Ward's page at `localhost:5173/ward/login?next=/prm/`, signing in returned to `/prm/` showing the account, and `/prm-api/api/places?city=Timișoara` returned seeded places. Not verified from a fresh `git clone`. Typecheck clean; tests 54 pass + 3 todo, unchanged.

Found on the way, not prm's: Ward's Sign out does nothing in a browser. `/logout` clears cookies only when it receives the refresh token, but `ward_refresh` is scoped to `/ward-api/refresh`, so the browser never sends it there; Ward answers 204 and the session stays live. Reported to the owner.

## [2026-09-27] audit + brief | Improvements sweep → briefs 18–28

A read-only survey of the whole repo, vetted against `decisions.md` and the existing queue. **26 raw candidates → 11 briefed, 7 on a watch list, 8 dropped.** The full ranked list, watch items and drop reasons are in [todos/2026-09-27-improvements-audit.md](todos/2026-09-27-improvements-audit.md). The five lens finders were dispatched but all died on a rate limit before reporting, so every finding was read and vetted directly. The ones marked ★ in the audit were reproduced.

The headline findings: `POST`/`DELETE` on places and events are open to anonymous callers (18). Every surface drops an event the moment it **starts**, which hides temporary exhibitions for their whole run and contradicts the locked lifecycle (19). The map fetches at most 1000 places with no ordering, while a real București sync is **3,171** (20, measured with one Overpass count query). A JWKS fetch failure resolves as "signed out" instead of 503, with nothing logged, contrary to prm's own rule and Ward contract rule 5 (21, reproduced). A fresh clone's backend dies at boot on missing Ward env, and the `.env.example` it points to does not exist (22). drizzle-kit has no snapshot for the hand-written `0001`, so the next `generate` re-does the cutover (23, reproduced on a scratch copy).

One question moved to [open-questions.md](wiki/open-questions.md): whether Ward resolution should leave the root hook, since the public map does ask Ward for every signed-in visitor.

Baseline at audit time: `npm test` 54 pass + 3 todo, typecheck clean. No source file was changed.

## [2026-09-04] build | Total UI/UX rework — new visual world + place-centric public surface

The user asked for a total UI/UX rework ("the main idea is good, I just don't like the ui/ux of it"). Ran the impeccable direction flow: captured product truth in `ui/PRODUCT.md`, derived four visual directions from the audience's own world, and presented them as **running coded mockups** rather than prose (a land-registry sheet, a tram diagram, an orienteering overprint, and the category standard). The user took the **standing exit deliberately** — the convention, played straight, "or even better" — with **Citymapper + Linear** as the craft bar. That is now locked in [decisions.md → Visual direction](wiki/decisions.md); the 2026-06-29 Fraunces/steel-blue world is retired without ever having been built.

Verified: `npm run typecheck` green all 3 workspaces; `npm test` = **68 pass + 3 todo** (up from 54); `npm run build -w ui` succeeds; the direction contract (seed `6c65d315`) is greppable in `build/client/index.html`; the design detector returns `[]`.

- **Backend (the surface could not exist without these).** `backend/src/lib/time.ts` — every Europe/Bucharest window in one place (`lensWindow`, `zonedTimeToInstant`, 90-day horizon), DST-correct via a two-pass offset, no dependency, 7 tests. `GET /api/places` gained a comma-separated `category` list, a `lens` (`today|weekend|all`) that **hard-filters**, and **`upcomingEventCount`** on every row. New `GET /api/places/:id/events` and `GET /api/whats-on` (`routes/whats-on.ts`, `shared/src/types/whats-on.ts`, shared `rowToEvent` in `routes/event-mapper.ts`). 7 new API tests.
- **Design system.** `ui/app/app.css` rewritten: cool-biased neutrals, one blue accent, 11 category hues (reused by `EventCategory` rather than adding 8 more), role-differentiated elevation, radii capped at 12px, **Archivo** as the single family, no webfont mono. Both themes designed, not inverted. Authoritative reference: **`ui/DESIGN.md`**.
- **Place-centric IA.** `/` is the map; `/places/:id` is a **child route** of it so the map stays mounted — one place surface for a pin click and a shared link alike (a deliberate deviation from brief 06's "full page + mini-map", because two divergent place views is what that brief forbids). `/whats-on` shares one filter store with the map. `/map`, `/events`, `/resources/:id` redirect. Day-one clustering, guided zero-results, loading/empty/error everywhere, focus management, draggable two-snap mobile sheet.
- **i18n without a framework.** `ui/app/lib/i18n.tsx` — RO default (browser language deliberately ignored), EN switch, `Intl.PluralRules` for Romanian's three forms including the "de" form above 19, `Intl.DateTimeFormat` in Europe/Bucharest.
- **Seed replaced.** 38 real Timișoara/București public places + 14 **synthetic** events, labelled as such in `db/seed.ts`. Real ingestion is still brief 04.

**Three bugs worth remembering, each invisible until something forced it out:**
1. **Unlayered CSS beats `@layer utilities` at any specificity.** A bare `a { color: inherit }` silently defeated every `text-*` utility on every link in the app. Base element rules now live in `@layer base`.
2. **A filled CSS animation outranks inline style.** The sheet's entrance keyframe ended on `transform: translateY(0)` with `fill-mode: both`, permanently pinning the sheet open and defeating its own snap transform.
3. **A Drizzle correlated subquery must use the query builder, not a raw `sql` template.** A raw template renders columns unqualified, so `place_id = id` resolved both sides to the subquery's own table and every event count came back zero.

**Constraint discovered:** CARTO's keyless raster endpoints now return a watermark tile, not a map. Style is behind `VITE_CARTO_API_KEY`; filtered OSM tiles are the documented fallback. See [decisions.md → Basemap constraint](wiki/decisions.md).

**Finish review:** 3 rounds via the shipped `impeccable-finish-reviewer`, ending **`ship`** — 11 material fixes plus 3 regressions all scored resolved. Scope limit recorded honestly: login/register, all loading/empty/error states, and every dark surface except the desktop place panel were never captured and so were never reviewed.

## [2026-07-02] build (wave 3) | Brief 03 shipped — place model & OSM sync

Admin-triggered OpenStreetMap (Overpass) sync + public places API + ODbL attribution (senior/opus, branch `build/backlog`). Verified from the controller: `npm run typecheck` green; `npm test` = **54 pass + 3 todo** (up from 39; +20 cases, Overpass stubbed — zero network); `db:migrate` from empty clean. **No structural migration** — built on brief 07's `place` table (07's promise held again).

- **Backend:** `backend/src/lib/osm-categories.ts` (priority-ordered `CATEGORY_RULES`, `mapTagsToCategory` unmapped→`other`, `OVERPASS_TAG_FILTERS` derived from the same rules so query+map can't drift); `backend/src/lib/osm-sync.ts` (`CITIES` bbox registry for timisoara/bucuresti, `buildOverpassQuery`, `fetchOverpass` = the network seam via `OVERPASS_URL`, area-weighted `centroid`, `upsertOsmPlaces`, `syncOsmForCity(db,city,deps)`). Routes: `backend/src/routes/places.ts` (`GET /api/places`, `GET /api/places/:id`), `backend/src/routes/admin-osm.ts` (`POST /api/admin/osm/sync` behind `requireAdmin`). Deleted the transitional `resources.ts` route.
- **Contracts:** `GET /api/places?city|lat|lng|radiusKm|category|page|pageSize` → `{data:Place[],total,page,pageSize}`; `POST /api/admin/osm/sync {city}` (key or diacritics-insensitive name) → `OsmSyncResult {city,fetched,upserted,inserted,updated,skipped*}`. Upsert matches only `source='osm'` on `(osmType,osmId)`; event-venue + `isManualPin` rows never clobbered (counted `skippedProtected`).
- **Shared:** `shared/src/types/osm.ts` (`osmSyncRequestSchema`/`osmSyncResultSchema`), `placesQuerySchema` in common.
- **UI (minimal):** repointed `ui/app/lib/api.ts` `/api/resources`→`/api/places`; `ui/app/lib/map.ts` `CARTO_ATTR` now carries explicit OSM + ODbL attribution. Full about-the-data page remains brief 09; full UI refactor remains brief 06.

## [2026-07-02] build (wave 2) | Brief 02 shipped — auth & admin gate

Full self-hosted email+password auth + admin gate (senior/opus, branch `build/backlog`). Verified from the controller: `npm run typecheck` green all 3 workspaces; `npm test` = **39 pass + 3 todo** (auth-internals seams filled: argon2id round-trip, single-use verify/reset tokens, session expiry; 3 remaining todos are the reminder-sweep → brief 05); `db:migrate` from empty clean.

- **Backend:** `argon2` 0.44.0 + `@fastify/cookie` 11.0.2 (exact-pinned). `backend/src/routes/auth.ts` (register/verify/login/logout/me/request-reset/reset), `backend/src/plugins/auth.ts` (auth plugin — resolves `request.user` from an opaque **`prm_session`** httpOnly+Secure+SameSite cookie backed by the `session` table; exposes `requireAuth`/`requireAdmin` guards via decorators). `backend/src/lib/auth-internals.ts` (hashing + token logic), `mailer.ts` (dev = console-logged verify/reset links), `ensure-admin.ts` (seeds/promotes one admin from `ADMIN_EMAIL`/`ADMIN_PASSWORD`). Built on brief 07's committed `user`(role|emailVerified)/`session`/`verification_token`/`reset_token` tables — **no structural migration needed** (07's promise held; admin = `role === 'admin'`).
- **Shared:** `shared/src/types/auth.ts` — `publicUserSchema`/`PublicUser`, `registerSchema`, `loginSchema`, verify/reset schemas, `userRoleSchema`.
- **UI:** `ui/app/stores/authStore.ts`, `ui/app/lib/authApi.ts`, `ui/app/routes/login.tsx`; Navbar profile dropdown now reflects real auth state.
- **Deviation vs. brief prose:** brief said `isAdmin`/`emailVerifiedAt`; used 07's committed `role`/`emailVerified` columns instead (source-of-truth = code). E2e happy-path deferred to brief 17 (Playwright).

## [2026-07-02] build (wave 1) | Briefs 07 + 11 shipped — schema consolidation + Vitest harness

First execution wave against the backlog (orchestrate → plan-split-dispatch, branch `build/backlog`, both dispatched senior/opus). Verified from the controller: `npm run typecheck` green all 3 workspaces; `npm test` = 25 pass + 7 todo seams; new files tracked, none wrongly gitignored.

- **Brief 07 — schema consolidation (done).** Replaced the NYC-era event-centric schema with ONE consolidated place-centric Drizzle schema (13 tables: place, event, user, session, verification_token, reset_token, event_source, staged_event, geocode_cache, favorite_place, favorite_event, notification, notification_event). `shared/` reshaped: `Resource`→`Place` (+ `PlaceCategory`, `PlaceSource` osm|event-venue), `Event` gains `placeId`/`status`/`buyUrl` and drops embedded address; `EventCategory` reused. Fresh single migration (`0000_overconfident_hiroim.sql`), empty→full. All locked schema decisions applied (uuid text PKs, natural-key uniques, status-enum lifecycle, UTC ISO dates, FK + spatial indexes). Threaded the breaking shared change through backend + ui. `architecture.md` ERD updated. Deviations: route paths kept transitional `/api/resources`+`/api/events` (rename is brief 03); added `event.normalizedTitle`, `staged_event.eventId`, `notification.batchId` proactively so later briefs need no structural migration.
- **Brief 11 — Vitest harness (done).** Stood up Vitest (root scripts `test`/`test:watch`/`test:cov`; `vitest.workspace.ts` + per-package configs; deps `vitest` 4.1.9 + `@vitest/coverage-v8` 4.1.9, exact-pinned). Added `buildApp()` factory + `buildTestApp()` helper (in-memory SQLite + migrator + Fastify `.inject()`). Real green tests: shared Zod edges, `geo` unit, `.inject()` API integration on existing routes. `it.todo` seams left for auth-internals + `runReminderSweep(now)` (features unbuilt — land with briefs 02/04/05). Playwright/e2e intentionally deferred to brief 17. Deviation: Vitest 4 dropped auto-discovered workspace files, so `vitest.config.ts` imports the `projects` list from `vitest.workspace.ts` (kept the file, made it run under v4).

## [2026-06-29] review-loop | Corpus stress test (post-splits + aesthetic edits) — drift fixed

Re-audited the corpus after the recent brief splits (15/16/17) + design.md overhaul. Found + fixed drift introduced since the last green-light:
- **Broken links (2):** brief 11 → `../../playwright/README.md` should be `../../../` (playwright is at repo root, brief is two dirs deeper); brief 12 → `../todos/` should be `../../todos/`. Both fixed; full link sweep now clean.
- **decisions.md had NO record of the aesthetic direction** (Fraunces/Voyager/Editorial-Civic lived only in design.md + log). Added a "Design direction (locked 2026-06-29)" subsection so decisions.md remains the single source for locked choices.
- **Fraunces font dependency was unbuildable-from-briefs** — added a Fonts bullet to brief 06 (owns root.tsx/Navbar) to add Fraunces + update the font preload/tokens.
- **index.md Todos** missing the new `2026-06-29-pin-map-aesthetic-research.md` → added.
- Verified: all internal links resolve, all todos indexed, briefs↔index parity intact. Green light still valid (these were doc-sync fixes, no scope/decision change).

## [2026-06-29] research + design | Pin/map UX + de-generic-ify design.md aesthetics

Researched (A) best-UX map pins + basemap and (B) what makes design.md read as "generic AI". Finding: design.md was almost a checklist of the generic-AI look (Inter-only, all-rounded, blue+slate, uniform shadows). Grilled the direction; all recommended options chosen. Revised `design.md` (+ matched its frontmatter tokens):

- **Aesthetic direction → "Warmer Editorial-Civic"** (was "Minimalist-Professional"), with explicit anti-generic rules.
- **Typography → two-family pairing:** **Fraunces** (variable serif) for display/headings/brand/place-titles; **Inter** kept for body/UI. Frontmatter scales updated (display + headline-* → Fraunces; body-*/label-* → Inter). Biggest personality lever.
- **Color:** keep dominant civic blue, **promote the amber tertiary to a deliberate warm accent**; warm the neutrals; color never the sole signal.
- **Geometry:** tightened rounding (cards ≤8px, drawers 12px not 16px, pills reserved for chips/badges), crisp borders over soft shadows.
- **Elevation:** role-differentiated (card vs drawer vs pin must not share one shadow).
- **Map Pins → icon-led + event-aware + zoom-aware:** per-category SVG icon as primary signal (color secondary), event-presence accent ring/badge, dot↔teardrop by zoom, unmistakable selected state. Added **Map Clusters** (styled divIcon, event hint) + **Basemap** (CARTO **Voyager** light / DarkMatter dark; self-hosted tinted style = future).
- Synced brief 06 pin bullet → points to design.md pin system. Captured full findings + sources in `todos/2026-06-29-pin-map-aesthetic-research.md`.

## [2026-06-29] brief | Split briefs 13 + 11 along real seams (→ 15, 16, 17)

Reviewed whether to split further. Most briefs are already small and system-scoped — declined to over-split. Split only where genuine independent surfaces existed; **kept brief 04 whole** (its admin API is thin wrappers over the pipeline — no real seam, splitting would just couple two always-built-together briefs).

- **Brief 13** (was "UI interactions & features") → narrowed to **public place-centric interaction detail**; carved out:
  - **Brief 15 — Draw-to-filter** (self-contained: Geoman plugin + point-in-polygon + draw-mode toggle plugging into 13's shared filter state).
  - **Brief 16 — Admin shell & ingestion review UI** (separate audience/route/gate; frontend for the brief-04 pipeline).
- **Brief 11** (was "test infrastructure & TDD/e2e") → narrowed to the **Vitest** harness (unit + Fastify `.inject()` integration) + TDD workflow + `runReminderSweep(now)` unit test; carved out:
  - **Brief 17 — Playwright e2e harness** (separate runner: config, fixtures, per-role storageState, seeded-DB determinism).

Numbers stable (15–17 new). Updated index table + build order (07→11→02→03→08→04→16→05→06→13→15→14→17→09→10), decisions.md cross-refs (draw→15, /admin→16), status.md per-area rows. All 16 todo briefs ↔ filesystem in parity.

## [2026-06-28] review-loop | Pre-development corpus stress test → GREEN LIGHT

Ran a pre-dev stress test (3 review→change rounds + targeted research) auditing the corpus against the actual code. Found + fixed real contradictions that would have bitten on day one:

- **`.js` import convention was wrong/dangerous.** decisions.md said "no `.js` suffixes anywhere"; but backend+shared run as Node ESM (`"type":"module"`, tsx/node) and the code correctly uses `.js` suffixes — stripping them breaks `node dist`. Verified via research (nodenext requires extensions; bundler is "infectious"). Corrected to package-specific rule + flagged a `nodenext` consideration for backend/shared.
- **Stale facts:** decisions.md + architecture.md said "shadcn/ui" (actual: `@base-ui/react`); architecture.md said shared = "pure types, no runtime" (actual: Zod + z.infer). Both corrected with history notes.
- **Brief 07 (built first) was out of sync** with later-session decisions: notification model (coalesced + `notification_event` join, not `(userId,eventId,kind)` for new-event), two category enums (Place/Event), event `past`/archived status, existing EventCategory enum to reuse. Added a sequencing note (07 creates ALL tables; later briefs add logic only) + import-extension convention.
- **architecture.md API table** presented the current event-centric routes as if target — added a forward-pointer to the place-centric API (briefs 02/03/04/05/14).
- **test-plans/index.md** presented stale NYC/event-centric plans as current — added a STALE banner → briefs 10/11.
- **Draw plugin validated:** brief 13 had listed "Geoman/Leaflet.draw" — research showed Leaflet.draw is unmaintained (2018) with NO freehand mode (the requested feature). Locked **`@geoman-io/leaflet-geoman-free`** + `@turf/boolean-point-in-polygon`.
- **Verified:** brief↔filesystem parity (all 13), no dead links (only log.md retains historical `02-admin-source-ingestion`), dependency graph acyclic + build order honors it.

Result: **status.md flips to 🟢 green light — cleared to start development at brief 07.** Remaining unknowns are empirical (source landscape, threshold tuning), resolved during their briefs.

## [2026-06-28] grill + brief | Open-questions resolved; event horizon + archive page (brief 14)

Grilled the remaining open questions; resolved the decidable mechanics → moved to decisions.md ("Ingestion & data mechanics") and pruned open-questions.md down to only what needs real-world probing / real-data tuning.

- **Venue↔place matching:** normalize + fuzzy token-set/trigram, two conservative thresholds (auto / ambiguous→admin / geocode).
- **"Changed" detection tiered:** date/venue/cancellation → re-review; price/desc/buyUrl/image → silent; whitespace → ignore.
- **Geocode sanity:** city-bbox + result-granularity + confidence floor → else manual-pin queue.
- **geocode_cache key:** conservative normalized address + city (RO abbrev expansion); bias to correctness over hit-rate.
- **OSM tag→PlaceCategory:** priority-ordered first-match-wins, ~8–12 buckets + visible "other", one primary category/pin; kept in sync with the Overpass filter.
- **Spatial index:** CLOSED for POC (bbox + (lat,lng)+city index; R-tree = future only).
- **Event horizon (was a gap):** upcoming-only on map/what's-on/reminders; past events → archived (not deleted), retained for dedup/reconcile + the archive page; periodic prune.

**New feature — archived-events page (brief 14):** public `/archive` with two tabs — "My past events" (logged-in user's past favorites — "what it saved") + "Citywide archive" (past events for the current city); each row links to its still-existing place page ("where it was"). Reuses the event-archive lifecycle + place surface; no new tables, no separate archive map. Build after 06/13. Index + status + decisions updated.

## [2026-06-28] grill | UI/UX stress test — edge cases resolved (2 overrides)

Stress-tested the UI/UX in briefs 06/13 + design.md against real-world failure modes the happy-path specs skipped. Resolutions folded into brief 13 (edge-cases section), brief 05 (notif coalescing), brief 12 (clustering note), decisions.md.

- **Pin density [override]:** clustering is **day-one legibility**, not deferred perf. Cluster at city zoom; category color + event badge resolve only zoomed-in. (Moved from brief 12 → brief 13.)
- **Timing filter [override]:** **hard-filter (remove), not dim** — dimming is invisible at density. Banner + count + clear. (Reverses decisions.md "dim, don't remove".)
- **Draw vs pan:** explicit **draw-mode toggle** (locks pan, done/cancel, hint).
- **Draw lifetime:** persists across pan/zoom/panel/what's-on; **cleared on city change** (toast).
- **Zero-results:** guided-recovery overlay — active filters as removable chips + clear-all + "X match if you widen/drop Y". Never a blank map.
- **Admin review at scale:** confidence-sorted — high-confidence pre-selected for one-click bulk accept; low-confidence buckets (ambiguous/needs-attention/geocode-failed/changed) surfaced first.
- **Notification flood:** new-event notifications **coalesced per (place, accept-batch)** (one "8 new events at X" item, not 8); reminders stay per-event. Changed `notification` model (placeId+batchId+event-id set for new-event kind).
- **Favorite while logged-out:** star visible (the hook) → contextual login prompt → completes the favorite in place.
- **Place deep-link:** `/places/:id` = full page + mini-map when cold/shared; panel-over-map in-app; draggable mobile sheet so the pin shows.
- **Mobile max-chrome:** collapsing chrome, filters/draw behind one button, draggable sheet — map stays the hero at 375px.

## [2026-06-28] research + grill + brief | Tests/schema/UI plans resolved; brief 13 + 2 new features

Research (map-detail UX, Drizzle schema patterns, Playwright auth/isolation) + an exhaustive grilling pass that resolved the full decision tree across three areas. Plus two new features requested mid-session.

**Schema (→ brief 07 detail + decisions.md "Data conventions"):** UUID PKs + unique natural-key constraints; status enums not soft-delete; two category enums (PlaceCategory/EventCategory); match state (`placeId`+`matchStatus`+JSON candidates) on `staged_event`, resolved placeId copied to live event on accept; UTC ISO 8601 storage, Bucharest TZ only at compute; FK + (lat,lng)+city indexes.

**Tests (→ brief 11 detail):** e2e DB isolation = seed-once + reset-for-mutators; auth via setup-project per-role storageState (gitignored) + a few real-UI auth specs; reminder sweep = exported `runReminderSweep(now)` with injectable clock (no test-only route).

**UI/UX + 2 new features (→ new brief 13, decisions.md "UI interactions & features"):** place panel events grouped-by-date + expand; selection pans/zoom-fits + deep-links; multi-axis AND filters shared with what's-on. **NEW: draw-to-filter** (free-hand + polygon, client-side point-in-polygon, ephemeral, ANDs with filters, Leaflet draw plugin). **NEW: /admin** own layout + sidebar contextual menu (Sources/Review/Places), lazy-loaded, gated; review screen = table + bulk toolbar + detail drawer w/ map preview + ambiguous resolver. Auth = dedicated centered-card routes. City picker **defaults to Timișoara**. Notification bell+dropdown. Loading/empty/error + WCAG AA on every surface. Dep policy: minimal, exact-pinned, justified per add.

Brief 13 added (build order: after 06). Fixed a stale `briefs/todo/02-admin-source-ingestion.md` link in decisions.md → points to brief 04.

## [2026-06-28] research + brief + corpus-UX | Optimization research, brief 12, glossary + index front door

Online research into making the corpus smoother + optimizing the platform (sources in `todos/2026-06-28-optimization-research.md`).

**Platform → brief 12 (platform optimization):** evidence-based, apply-incrementally optimizations. DB: WAL + synchronous=NORMAL + foreign_keys + busy_timeout PRAGMAs at startup (apply with schema brief 07); prepared statements. Spatial: `(lat,lng)`+`city` indexes, server-side bbox+city filtering, R-tree as a noted future option. Map: viewport-only markers, Leaflet.markercluster + chunkedLoading, canvas renderer, clearLayers/addLayers — all gated on *measured* slowdown (real data, brief 08). SPA: debounced bbox refetch, route-lazy admin UI. Explicit "do NOT pre-optimize" section. WAL caveat (same-host) noted — aligns with single-VPS deployment.

**Corpus UX (applied now):** added `wiki/glossary.md` (defines place/OSM/Overpass/staged-event/etc. — jargon-dense domain); upgraded `index.md` with a "New here?" path + task-oriented "Start here" table. Captured the larger rollout (front-matter metadata — research cited 89% discoverability gain; per-page source-of-truth lines; decision IDs) as `todos/2026-06-28-corpus-ux-improvements.md`. Rejected Docusaurus (LLM is the consumer, not a docs-site audience). Also flagged `status.md` as stale (predates the reframe) — refreshed separately.

## [2026-06-28] brief | Brief 11 — test infrastructure & TDD/e2e harness

Filed brief 11 — the testing *machinery*, distinct from brief 10 (test *plans*). Found that despite the locked testing decision, **no test infra exists**: no runner, no config, no specs, no test scripts; "Playwright" had been manual screenshot-driving only. Brief 11 stands up the pyramid: **Vitest** (unit + auth internals + Fastify `.inject()` API integration, co-located `*.test.ts`) and **@playwright/test** (assertion-based e2e in a new `e2e/` dir, seeded throwaway RO DB, T/B geolocation mock, test-only reminder-sweep trigger). Root scripts `test`/`test:watch`/`test:cov`/`test:e2e`/`test:all`. Deps reasoned to house style: Vitest (Vite/ESM fit, no Jest), no supertest (use Fastify `.inject()`), component-test deps deferred. **No GitHub Actions / hosted CI** (user choice) — `npm run test:all` is the local pre-commit gate. The manual `playwright/` hub is kept for brief 10's visual audit; automated e2e is separate. Build order updated: 11 lands right after schema (07) so features 02–06 can be built test-first.

## [2026-06-28] brief | Four foundational briefs added (07–10) + build order

Corpus + online exploration surfaced gaps the feature briefs (02–06) didn't own. Added:
- **07 — Schema consolidation** (build FIRST): reconcile the NYC `resource`/`event` schema with the place-centric model; one coherent migration instead of 03/04/05 each bolting on colliding tables. Clean reset acceptable (POC, no prod data).
- **08 — Real RO seed data**: deterministic `db:seed` from a captured OSM sync (frozen fixture) + hand-curated real T/B events + a demo user with favorites/notifications. Replaces NYC; first real-data milestone.
- **09 — Attribution & "about the data"**: ODbL requires `© OpenStreetMap contributors` (+ CARTO) map-corner attribution (confirmed from OSM Foundation guidelines); per-event source credit; an about-data page with the link-out posture + iaBilet POC disclaimer + takedown contact. Compliance, not polish.
- **10 — Test plans rewrite**: TP-01–04 test the old event-centric UI; rewrite for place-centric + add TP-05 auth / TP-06 favorites+notifications (reminder idempotency) / TP-07 admin ingestion. Switch geo mock NYC→T/B.

Numbers are stable ≠ build order. Recommended order recorded in `index.md`: 07→02→03→08→04→05→06→09→10→deploy. Deployment execution brief deferred (decision locked; write when its time comes). `index.md` briefs table updated.

## [2026-06-28] research + decision | Competitor/source landscape scan → three decisions (two reversals)

Scanned comparable platforms + probed the real RO event-source landscape (full findings: `todos/2026-06-28-competitor-research-findings.md`). Key learnings: Bandsintown is our retention-loop mirror (wins via push+email); Localist confirms API-first/scrape-last is industry-standard; **but** probing showed RO sources are almost all static HTML (data.gov.ro cultural calendar is a dead static XLSX; museums/OneEvent expose no feeds), and the comprehensive layer (ZileșiNopți/OneEvent) are reuse-restricted competitors. Net: no RO source is clean + machine-readable + comprehensive — pick 2 of 3.

Three decisions (recorded in `wiki/decisions.md`; briefs 04/05 updated):
- **Event sourcing = clean + sparse.** Scrape only defensible primary publishers (municipal/publicly-funded calendars + venues/museums); accept sparse coverage; **OSM resources carry the map**. Do NOT scrape commercial aggregators.
- **[REVERSAL] Adapter scope: "build all" → build a few (2–4) clean adapters well.** Confirmed every adapter is fragile bespoke HTML scraping; "all sources" is post-POC expansion.
- **[REVERSAL] Notifications: "in-app-only" → in-app inbox + email.** Email reuses auth email infra and buys the away-from-app retention ping (the loop's whole point per Bandsintown). Web/native push stays the #1 post-POC upgrade.

## [2026-06-28] brief | Split brief 02 into 02–06 (dependency-ordered)

The rewritten brief 02 had grown to span auth, the place model, OSM sync, the event pipeline, favorites/notifications, and admin UI — three+ buildable units under one number. Split into five focused briefs in build order:
- **02 — Auth & admin gate** (rescoped from the old 02 file; prerequisite for all admin work).
- **03 — Place model & OSM resource sync** (resources-first anchor; events attach to places).
- **04 — Event ingestion pipeline** (refresh/match/geocode/reconcile/diff/accept; depends on 02+03).
- **05 — Favorites & in-app notifications** (retention loop; depends on 02/03/04).
- **06 — Place-centric map UI** (refactor of the existing 3-surface UI; depends on 03/04/05).

Admin-UI concerns from the monolith are folded into each owning brief (sources panel + diff/review in 04; OSM sync action in 03) rather than a separate brief. `index.md` briefs table updated. Old `02-admin-source-ingestion.md` removed (its content is distributed across 02–06; rationale preserved here + in `decisions.md`).

## [2026-06-28] decision | Major reframe — POC, place-centric, public-source ingestion (grilling session)

A deep grilling session re-shaped the product across eight branches. All locked in `wiki/decisions.md`; `overview.md`, `open-questions.md`, and `brief 02` rewritten to match.

- **Legal (the trigger):** read iaBilet's ToS (`/terms/ro/`). **Art. 28.3 forbids extracting/reproducing/publicly communicating their content in any form, wholly or partially**; 28.1 vests all IP in them. The "link-out aggregator" defense does **not** cure a ToS breach, and text-only cards don't either. → Project **reframed as a proof-of-concept**; iaBilet adapter is POC-only, **permission is a hard launch blocker**.
- **Product shape:** pivoted **events-first → place-centric, resources-first**. Map unit is a **place**; events attach to places. Two place sources: **OSM** (ODbL, clean anchor) and **event-venue** (created when an event's venue can't match an OSM place). Ambiguous venue↔event matches go to the admin, not auto-merged.
- **Event sourcing:** from **public primary publishers** (venue/museum/municipal calendars), never scraped aggregators. **API-first, scrape-last** discovery (iCal/RSS/JSON-LD/sitemap before HTML). Scope: **Timișoara + București**, build **all** per-city adapters (chosen with cost in view). Images dropped — **text-only cards, category by color.**
- **Robustness:** refreshes **reconcile** (stale/changed, not append-only); per-source **health flags** (`suspect` on 0/big-drop); **soft-break quarantine** via Zod sanity checks.
- **Auth:** full end-user auth **kept**, re-justified as a demoed POC retention feature.
- **Notifications: in-app inbox only** (no email/push). Two favorite entities (`favorite_place`, `favorite_event`). Trigger #1: inbox on **admin-accept** for place-favoriters. Trigger #2: **in-process daily reminder sweep** in the Fastify API — fixed local time, next-calendar-day in **Europe/Bucharest**, idempotent via unique `(userId,eventId,kind)`.
- **Geocoding:** **fallback only** (OSM-match first), Nominatim public (1 req/s, UA, cache), **manual-pin** for failures (never drop), self-host noted as future.
- **Map UI:** map is home; **pin = place** (category color + event badge); **unified place panel** (`/resources/:id` collapses in); standalone `/events` reframed as a citywide **"what's on"** index linking back to places; **city picker** added as primary nav.
- **Deploy:** pm2 runs **one** Fastify process (reminder sweep in-process); **no separate cron**. **OSM sync bypasses the accept gate** (trusted/licensed), admin-triggered + infrequent, upserts `source:osm` only.

Next action: the existing code + brief 02 now need to catch up to these decisions (the code still reflects the old event-centric NYC-seed model).

## [2026-06-28] decision | Product direction locked — real RO events product, auth/testing/deploy chosen

Grilling session resolved eight branching decisions, now recorded in `wiki/decisions.md`:
- **Direction:** real product (not portfolio/learning).
- **Market + data:** Romania, events-first; iabilet.ro anchor + OSM resources secondary; NYC seed to be replaced.
- **Ingestion:** investigate iabilet (affiliate? internal JSON? ToS? venue geocoding?) *before* building — tracked in `wiki/open-questions.md`.
- **Location:** city picker primary (persisted), GPS optional.
- **Auth:** full email+password now, self-hosted, argon2id, httpOnly+Secure+SameSite session cookie in SQLite, verify/reset flows built now with console-logged links in dev.
- **Testing:** e2e-first Playwright (assertion-based, seeded DB) + thin Vitest suite for auth internals.
- **Deployment:** single VPS via bootstrap-vps-deploy — Caddy (auto-HTTPS) + pm2 (Fastify + ingestion cron) + host volume for `app.db`.

Recommended build order: investigate iabilet → city picker + real RO data → e2e harness → auth → deploy.

Also fixed stale `wiki/architecture.md`: all four routes (`/`, `/map`, `/events`, `/resources/:id`) are wired (it claimed `/events` wasn't a route), and refreshed the UI file map to reflect the real tree (map/, hooks/, stores/, TanStack Query, Zustand). Next action: investigate iabilet.ro ingestion.

## [2026-06-28] decision + brief | Admin-curated multi-source ingestion (supersedes cron)

Changed the ingestion model from an autonomous cron to an **admin-curated refresh pipeline**, and broadened from iabilet-only to **multiple Romanian sources**.
- Researched RO event platforms. Probed for machine-readable data: **iaBilet.ro** = JSON-LD (best); **bilete.ro/entertix.ro/myticket.ro** (one PLG group) declare **sitemaps with `lastmod`**; **Eventim.ro** bot-protected (defer); **livetickets.ro** thin/JS (defer). Source table in `wiki/open-questions.md`.
- New model (locked in `wiki/decisions.md` → "Event ingestion model"): admin manages a **source list**, hits **per-source / refresh-all** buttons, pipeline does fetch→parse→geocode→**dedup**→**diff of what's new**, admin **accepts/bulk-accepts** (and reject/ignore); only accepted events go live. Ingestion sits behind the **admin gate** (auth moved earlier in build order as a prerequisite).
- Filed **brief 02** (`briefs/todo/02-admin-source-ingestion.md`): data model (`event_source`, `staged_event`, `geocode_cache`), admin-gated API, admin UI, dedup (within + cross-source), and open mechanics to resolve at build.

## [2026-06-28] investigation | iabilet.ro ingestion mechanism

Investigated how to get iabilet.ro events into the DB. Findings (full detail in `wiki/open-questions.md`):
- No public API / affiliate feed; iabilet's "partner" offerings are seller-side (white-label ticket sales, ads).
- robots.txt permits event listing/detail pages (disallows only auth/account/cart/googleMap/short-links). No sitemap.
- **Best path: parse embedded schema.org JSON-LD** — every listing page has ~10 Event blocks, detail pages have one; fields map ~1:1 to our `Event` schema (name, url, dates, image, location address, price/currency). Must fetch raw HTML (WebFetch strips the ld+json).
- **Geocoding required** — JSON-LD has street address only, no lat/lng.
- Pagination + city filtering are client-side JS (`Paginated.js`); page-2/per-city extraction still to resolve at implementation time (Playwright or the AJAX endpoint).
- Design: cron (pm2) → fetch → parse JSON-LD → geocode (cached) → upsert with dedup on canonical url/id.

## [2026-06-26] done | UI audit run — 1 bug fixed, 2 findings filed

Ran TP-01 through TP-04 against seeded data. Fixed raw JSON rendering in resource
detail Hours section (`HoursDisplay` component in `resources.$id.tsx`). Filed F-01
(map chip overflow on mobile) and a minor title-tag observation as corpus todos.
Full results in `test-plans/RESULTS.md`.

## [2026-06-26] done | Seed script added; 8 resources + 8 events loaded (NYC)

Added `backend/src/db/seed.ts` and `db:seed` npm script. Seeded 8 resources and
8 events around New York City (Central Park area). Migration confirmed clean.

## [2026-06-26] done | Stitch screens integrated into corpus; stitch_output removed

Extracted structural patterns from all 4 Stitch HTML screens into `wiki/stitch-screens.md`. Moved brief 01 to `briefs/done/`. Deleted `stitch_output/` directory and `stitch_civic_mapper.zip` from repo root. Updated `index.md` accordingly.

## [2026-06-26] todo | Brief 01 — Stitch design brief filed

Filed `briefs/todo/01-stitch-design-brief.md` — a full design brief for Stitch (or any design tool) covering the map home screen, detail drawer, events list, map pins, and color/token system. Covers implemented vs. to-do scope and design constraints (responsive, dark mode, WCAG AA, Tailwind/Radix stack).

## [2026-06-26] done | Brief 01 — CivicMap design implementation shipped

Implemented the full Stitch CivicMap design system. Key deliverables:
- Replaced shadcn/ui with `@base-ui/react` (Button, Avatar, Menu, Toggle, Slider, Input)
- Added `react-leaflet` + CartoDB Positron/DarkMatter tiles
- CSS custom property token system + `@theme inline` Tailwind v4 bridge
- Component library: CategoryBadge, FilterChip, EventCard, MapPin, DetailDrawer, SearchInput, Pagination, RadiusSlider
- Rebuilt Navbar with CivicMap branding and lucide icons
- Wired all 3 routes: `/map` (Leaflet + filter overlay), `/events` (grid + filter chips), `/resources/:id` (detail page)
- Home (`/`) redirects to `/map`
- Fixed `Layout.tsx` default export (was causing navbar to not render)
- Fixed `ResourceMarkers.tsx` — removed `react-dom/server` import breaking SPA mode
- Typecheck passes clean; all routes render correctly verified with Playwright

## [2026-06-26] maintenance | Bootstrap monorepo + corpus

Restructured project as npm workspaces (`shared`, `backend`, `ui`). Updated all packages to latest stable (React 19.2.7, React Router 8.0.1, Vite 7.3.6, Fastify 5.8.5, Tailwind 4.3.1, TypeScript 5.8.5, Drizzle 0.45.2). Created Fastify + SQLite backend with Drizzle ORM and Zod validation; generated initial migration. All three packages compile and type-check cleanly. Seeded corpus wiki (overview, architecture, decisions, status, open-questions).

## [2026-09-06] change | prm moves to Ward: no credentials left in this repo, roles become grants

prm authenticates nobody now. Dropped: `user`, `session`, `verification_token`,
`reset_token`, `plugins/auth.ts`, `routes/auth.ts`, `lib/auth-internals.ts`,
`lib/ensure-admin.ts`, `shared/src/types/auth.ts`'s schemas, and the
`/login` + `/register` screens. There is **no credential of any kind** in this
repo any more.

**prm is the app that shaped Ward's design, and it kept what it needed.** The
estate's first cut had no public signup; prm ships it, and that collision is
what moved the security boundary from registration to **authorization**. Anyone
may hold a Ward account; a grant is what lets them reach anything. prm's app row
is the only one in the estate with `public_registration` on, and
`/ward/register?app=prm` confers exactly `prm:user`.

**Roles became grants, and one subtlety needed spelling out.** `requireAuth` now
means *holds a prm grant*, not *has a session* — a live Ward account with no prm
grant is not signed in here, which is precisely what stops open registration at
prm from opening atrium. And **`prm:admin` does not imply `prm:user`**: grants
are a set, not a ladder, and Ward has no hierarchy to consult, so `requireAuth`
accepts either explicitly. Assuming otherwise would have produced an admin who
could not open their own favourites.

**Nothing is gated by default, and that is the property most worth not losing.**
Every other app in the estate gates its whole surface and allowlists exceptions.
prm is a public resource map and does the opposite: the root hook resolves a
session only when a cookie is present, and the guards are opt-in per route. The
consequence is that **when Ward is down, the public map still works** — it never
asks Ward anything. Guarded routes answer 503 and fail closed, and
`request.wardUnavailable` is tracked separately from `request.ward === null` so
a guard never tells somebody they are signed out when the truth is that the
identity service is unreachable.

**`GET /api/me` is new, and prm has it rather than the UI calling Ward.** Ward's
own `/ward-api/session` answers with the *whole estate's* grant map; the browser
has no business receiving this person's atrium roles on every page load of a
public map. And "am I a prm admin" is prm's interpretation of a grant, not a
fact Ward holds. So the route answers narrowly — subject, username, `isAdmin` —
and the grant map does not leave the server. It never 401s: anonymous is the
ordinary case here.

**The config is read lazily, and that was a real finding rather than a
preference.** Validating at import and `process.exit(1)`-ing is what prm's other
config does, and it broke every API test instantly: `buildApp` accepts an
injected Ward client so tests can decide who is signed in without a network, and
an import-time exit killed the worker before the injection happened. Reading on
first use keeps the failure just as loud where it matters — the real client
reads all three during boot, before the server listens.

**Tests got a fake Ward rather than stubbed guards.** `test/fake-ward.ts`
implements the client interface and maps a cookie value to a session, so the
**real** `requireAuth`/`requireAdmin` decide. Stubbing the guards would have
made the guard tests tautological, and the assertion actually worth having is
that `requireAdmin` refuses a session holding only `prm:user`.

**The cutover destroys every account and everything keyed on one.** prm keyed
people on **email**, Ward keys them on a minted subject, and no mapping exists
that was not invented at cutover time — so favourites and notifications go with
the accounts that owned them. Places, events, sources and the geocode cache are
untouched: that half of the app never knew about accounts and does not notice.
`drizzle/0001_ward_cutover.sql` has **no down**. Take a database copy first.

54 tests pass, typecheck clean across shared/backend/ui. Nothing has been run
against a real browser or a deployed Ward.

## [2026-09-06] done | A documentation site at `/prm/docs`

`docs/` — Astro + Starlight, built by `npm run docs -w @prm/docs-site`, deployed
at the estate's `/<project>/docs` convention.

**Four authored pages**, chosen as the things the corpus does not carry: an
orientation page, the **HTTP route table** (and why authentication here is
opt-in per route rather than app-wide, which is the opposite of atrium), the
**data model** (nine Drizzle tables, the partial unique index that makes an OSM
re-sync an upsert, and the two independent status axes on `staged_event`), and
the **ingestion pipeline**. The nine corpus pages are rendered on every build
rather than restated.

**Two archify diagrams**: the workspace/source architecture with the Ward
boundary, and the ingestion flow — which makes the asymmetry legible, that
places are *synced* while events must clear both a match and a human before they
become real.

**The docs wear `ui/DESIGN.md`.** Palette, Archivo as the single family,
tabular numerals, the 12px radius cap and the "a 1px border is the default
separator; shadow is spent only on what genuinely floats" rule. Both themes ship,
for the reason DESIGN.md gives — the use scene is daylight outdoors *and* a
laptop indoors. The eleven category hues are deliberately **not** used as
decoration: in the app they carry information and are always paired with an icon
and a label, and spending them on docs chrome is exactly the misuse rule 4
exists to prevent.

**One build trap worth knowing.** Astro's build imports named exports from
`cookie@2`, but Vite's module runner resolves bare specifiers from the *project
root* — and this monorepo hoists `cookie@0.7.2` there, pulled in by `express` via
`@react-router/serve` in `ui/`. Node's own resolution finds astro's nested copy
correctly; Vite's does not, and the build dies at the very last step with
`Named export 'parseCookie' not found`. A `cookie@^2` devDependency in `docs/`
fixes it by giving the docs project root its own copy; the reason is recorded in
a `//cookie` key in `docs/package.json` so nobody removes it as unused.

Typecheck clean, 54 tests pass. `docs` added to the root `workspaces` array;
`build` and `typecheck` name their workspaces explicitly, so neither picks it up.
