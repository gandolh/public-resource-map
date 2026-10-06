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
