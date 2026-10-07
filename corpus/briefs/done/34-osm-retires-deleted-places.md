# Brief 34 — An OSM re-sync retires places OSM no longer has

> Written 2026-10-06. Promoted by the owner from the [2026-09-27 audit](../../todos/2026-09-27-improvements-audit.md)'s watch list.

## Context

`upsertOsmPlaces` (`backend/src/lib/osm-sync.ts`) inserts and updates, and never
removes. A library that closed and was deleted from OSM stays on the map forever.
Events have reconciliation; OSM places have none.

Places carry `source` (`osm` | `event-venue`), `osmType`/`osmId`, and
`isManualPin`. Favorites and events point at places by id, so a hard delete would
break both.

## Decide first, and record in decisions.md
- **Soft retirement, not delete.** A retired place is hidden from the map, search
  and the place list, keeps its row, and keeps its favorites and past events. Name
  the column (`retired_at`, nullable).
- **What a sync may retire:** only `source = 'osm'` rows of the synced city that were
  not in this sync's Overpass result. Never `event-venue` rows, never manual pins.
- **A safety valve.** An Overpass result that would retire more than a small share
  of a city's places (pick the threshold, say why) is treated as a bad response:
  retire nothing and report it. A truncated or failed query must not empty a city.
- **Coming back:** a retired place that reappears in OSM is un-retired by the next
  sync.

## What to do
1. Migration for `retired_at` (with its snapshot, chained, per brief 23's guard).
2. Retire and un-retire in the sync. Report counts beside inserted and updated.
3. Every public read filters `retired_at IS NULL`. A favorited place that retired
   shows in the user's favorites as "no longer listed", not as a broken link.
4. Upcoming events still pointing at a retired place go to admin review.

## Acceptance
- Tests: a place missing from the second sync is retired; it is back after a third
  sync that includes it; a manual pin and an event venue are never retired; a sync
  whose result would retire past the threshold retires nothing.
- `drizzle-kit generate` on a scratch copy reports no changes after the migration.
- `npm test` and `npm run typecheck` pass.

## Outcome (2026-10-07)

Shipped as specified, decisions first (decisions.md → OSM resource ingestion).

- **Column:** `place.retired_at`, nullable text. Migration `0004_place_retired_at` was made by
  `drizzle-kit generate`, so its snapshot chains to 0003's. `schema.ts` puts the column after
  the timestamps, where `ALTER TABLE` adds it, so the brief-29 drift check holds.
- **What a sync retires:** listed (`retired_at IS NULL`) `source = 'osm'` rows of the synced city,
  not manual pins, whose `(osm_type, osm_id)` is not among the answer's places. "Among the
  answer's places" means after `elementsToPlaces`, so a feature that lost its name also retires.
  Event venues and other cities are never touched.
- **Safety valve: 10%** (owner's figure). If an answer would retire more than 10% of the city's
  listed OSM places, it retires nothing and the result's `retirementHeld` says how many it would
  have. Exactly 10% goes through. Why: real closures arrive a few at a time between syncs, while a
  truncated or failed Overpass answer drops far more. Upserts still run on a held answer, since
  what it does contain is good data.
- **Coming back:** the upsert clears `retired_at` and counts it in `unretired`. Same row, same id,
  so favourites and history reconnect.
- **Reads:** the place list and its count, a place, its programme, what's on, `/api/events`, an
  event, and the public archive all skip retired places. The venue matcher and the admin's place
  picker skip them, and following one is a 404. A follower's bell item and "my past events" row
  name the place, say "no longer listed" ("Nu mai apare pe hartă"), and link nowhere
  (`listed: false` on the DTOs). There is no favourites list page; those are the two places a
  followed place appears.
- **Review:** upcoming or running live events at a newly retired place go back to review. Their
  accepted staged rows turn `changed`, with no place and an `issues` note naming the place. The
  drawer now shows `issues` on any row, not only quarantined ones. An event created by hand has
  no staged row, so it stays where it is, hidden with its place.
- **Admin:** the sync message adds retired, returned and sent-to-review counts, and warns when the
  valve held.

Verified: tests for retire then return, protected rows (manual pin, event venue, other city), the
valve (15% and an empty answer held, 10% allowed), and the review hand-off in `osm-sync.test.ts`.
`retired.api.test.ts` covers every public read, the follower views and the place picker.
`drizzle-kit generate` on a scratch copy of `backend/drizzle`: "No schema changes, nothing to
migrate". `npm test` 240 passed, `npm run typecheck` clean, e2e 27/27 run serially. A deployed
database needs `db:migrate` for 0004 before this code runs.
