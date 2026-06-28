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
