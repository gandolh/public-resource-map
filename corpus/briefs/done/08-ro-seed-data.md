# Brief 08 — Real RO seed data (Timișoara + București)

> Written 2026-06-28. Depends on **brief 07** (consolidated schema) and **brief 03** (OSM sync). Replaces the NYC placeholder seed. Unblocks place-centric UI (06) and all testing (10).

## Goal

A deterministic `db:seed` producing **real Timișoara + București data**: OSM-sourced places plus a small hand-curated set of **real events** attached to real places — so dev, e2e, and demos mirror production instead of NYC.

## Why

The current `db:seed` loads 8 NYC resources + 8 events; geolocation mocks and test plans all assume NYC. The place-centric UI (06) and the whole testing story (10) need realistic RO data to build/verify against. This is also the **first real-data milestone** of the project.

## Approach

- **Places: from a captured OSM sync.** Run the brief-03 OSM sync for Timișoara + București once, and **freeze the result as a committed fixture** (JSON) that `db:seed` loads. Rationale: deterministic + offline (no live Overpass in CI), but faithful to real OSM output (unlike a hand-written fixture). Document how to refresh the fixture when needed.
- **Events: hand-curated, real, small.** A handful of genuine current/near-future events at real T/B places (museum exhibitions, municipal events), each attached to its place (OSM match or event-venue). Include at least one with a `buyUrl` and one without, to exercise both UI paths.
- **A demo user** (verified) with a couple of `favorite_place`/`favorite_event` rows + a sample notification, so the retention loop is demoable from a fresh seed.
- **Coordinates** are real; this also lets geolocation mocks switch from NYC to a T/B default.

## Determinism

- Stable IDs in the fixture (not random) so e2e assertions can target known rows.
- `db:seed` is idempotent: reset → load fixture → known state every run.

## Acceptance criteria

- `db:seed` populates real T/B OSM places + curated events + a demo user with favorites/notifications, deterministically.
- At least one event has a buy-link and one doesn't; at least one event-venue place exists (venue not in OSM).
- No NYC data remains anywhere (seed, mocks, docs).
- The OSM-fixture refresh procedure is documented.
- e2e (brief 10) can rely on stable seeded IDs.

## Outcome (2026-10-04)

Built as a reset-and-load seed over a frozen OSM capture. Two parts of the
brief were dropped on purpose; both are explained below.

- **Places come from a frozen OSM sync.**
  - `backend/src/db/capture-osm.ts` (`npm run db:capture-osm -w backend`)
    runs the admin sync's own Overpass query and normalisation once per city.
    It writes `src/db/fixtures/osm-places.json`, one place per line and sorted,
    so a refresh diffs row by row.
  - The capture is 2,676 named places (517 in Timișoara, 2,159 in București),
    about 690 KB.
  - It retries a busy Overpass and honours `OVERPASS_URL`. This capture came
    from the `overpass.private.coffee` mirror after overpass-api.de answered
    504.
  - Run it by hand and rarely, never in CI.
- **One event venue that OSM lacks:** Piața Victoriei in Timișoara
  (`source: event-venue`, a square). It is the e2e geolocation's spot too.
- **Events stay synthetic, re-pointed at OSM places:**
  - 15 events, dated from `now`, as before. At least one has a ticket link and
    at least one has none, and one runs over several weeks.
  - Each is attached by OSM element (`osm("node/2634652196")`). The seed fails
    loudly if a refresh drops one of those places.
- **Stable ids.** `src/db/seed-ids.ts` gives every row a name-based UUID
  (version 5) of what it is:
  - `osm:node/…` for a place, a slug for a venue, the title for an event;
  - `SEED.places` names the rows e2e uses, and the specs fetch them by id.
    `placeNamed` is gone, and it could not have found a place among 2,676
    anyway.
  - The OSM sync upserts by OSM key, so a live sync over a seeded database
    keeps these ids.
- **Idempotent, by reset.**
  - `seedDatabase(db, opts)` (`seed-data.ts`) clears places, events, staged
    rows, favourites and notifications in one transaction, then loads.
    Sources and the geocode cache are configuration, so they are kept.
  - Every run gives the same rows and the same ids.
  - `seed.ts` is the CLI. It refuses to run with `NODE_ENV=production`.
- **The demo user is a Ward subject.** prm holds no accounts, so
  `SEED_DEMO_SUBJECT=<subject from /api/me>` gives that person:
  - two followed places and one saved event;
  - one new-events bell item, made by `notifyNewEvents` itself.
- **No NYC remains in code, seed or the wiki.** Updated: overview.md, status.md
  and the README.
  - `test-plans/` still mock NYC: rewriting them is brief 10.
  - `ui/PRODUCT.md` names the NYC seed only as the history of the
    anti-reference.
- **Dropped:**
  - **Real curated events.** Real "current" events are stale within days of a
    commit, and a seed of real-looking stale events is what brief 09's "events
    are samples" line warns about. Real events arrive through brief 04 from
    sources the owner vets.
  - **A verified demo account.** Verification is Ward's.
- **Found:** the city bboxes catch neighbouring towns, so "Timișoara" includes
  the town halls of Giroc, Dumbrăvița and Ghiroda, and "București" includes
  Bragadiru and Pantelimon. That is faithful to the live sync, which has the
  same bboxes. Clipping to the municipal boundary would be a change to the
  sync, not the seed.

**Tests:**
- `src/db/seed.test.ts` (6 tests):
  - ids are stable across runs and across databases;
  - both cities and the venue are present;
  - ticket links appear both ways;
  - a reseed wipes added favourites;
  - the demo subject's rows.
- `npm test` 174, e2e 17 (now against 2,676 places), typecheck clean.
- Checked by eye: the map opens on 518 Timișoara places, clustered, 7 with a
  programme.

**Addendum (2026-10-04): clipped to the city limits.** The owner chose the
municipal boundary over the bounding box (decisions.md). The sync now queries
inside each city's OSM administrative relation (Timișoara 6927733, București
377733), and the fixture was recaptured: 2,449 places (453 and 1,996), with no
neighbouring town halls. Every place the seeded events use is still there.
