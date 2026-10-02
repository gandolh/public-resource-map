# Brief 20 — The map loads every place in the city (no silent 1000 cap)

> Written 2026-09-27 from the [improvements audit](../../todos/2026-09-27-improvements-audit.md) (#3). **Depends on 19** (shares `places.ts` and `whats-on.ts`; different lines).

## Context

The map fetches one page and treats it as the whole city:

- `ui/app/lib/api.ts:65` requests `pageSize: 1000`, the server maximum (`placesQuerySchema`, `shared/src/types/common.ts`). `usePlaces` (`ui/app/hooks/usePlaces.ts`) never asks for page 2.
- `GET /api/places` has **no `ORDER BY`** (`backend/src/routes/places.ts:111-117`), so *which* 1000 come back is whatever order SQLite happens to scan in.
- Map search filters the loaded list in memory ("the whole city is in memory", `ui/app/routes/map.tsx`), and the count label reports the loaded count.

**Measured 2026-09-27:** one Overpass count over the București bbox, using the app's own `OVERPASS_TAG_FILTERS` and only named elements (what `elementsToPlaces` keeps), returned **3,171**. After the first real `POST /api/admin/osm/sync` (which [status.md](../../wiki/status.md) tells operators to run), about 2,171 places silently disappear from the map. Search cannot find them, and the label says "1000 places". Brief 25 trims about 1,000 pharmacies from that set; it would still be about 2,150, over the cap.

A second, smaller defect has the same cause: offset pagination without a total order is not deterministic, so pages can overlap or skip rows. `/api/whats-on` orders by `start_date` only, which leaves ties between pages undefined.

**Relation to brief 12.** Brief 12 plans viewport-bbox fetching as a *performance* step, triggered by slowness. This brief is the *correctness* floor for now. Brief 12 can replace the fetch strategy later; it must then keep search and the count honest.

## Files you OWN
- `backend/src/routes/places.ts` — the `GET /places` list query (ordering only)
- `backend/src/routes/whats-on.ts` — the `orderBy` only
- `ui/app/lib/api.ts`, `ui/app/hooks/usePlaces.ts`
- `backend/src/routes/paging.api.test.ts` (new)

## Files you must NOT touch
- `shared/src/types/common.ts`: keep the 1000 maximum. Page through instead of raising it.
- Map rendering, clustering and markers (brief 12's territory).
- The event predicates (brief 19).

## What to do
1. **Server:** add `ORDER BY place.id` to the `/api/places` list query (the PK, so it is free), and add `event.id` as a tiebreaker after `start_date` in what's-on.
2. **UI:** add a fetch-all helper beside `fetchPlaces`. It fetches page 1, then the remaining pages up to `ceil(total / 1000)`, in parallel, and passes the TanStack Query `signal` through. It returns one `PaginatedResponse<Place>` with every row, and `usePlaces` uses it. Keep the query key and `placeholderData` unchanged.
3. **Safety cap:** stop after 10 pages (10,000 places). If `total` is larger, keep what loaded and `console.warn` the shortfall. That is far past the POC's cities, and it says so rather than hiding it.

## Acceptance
- New API test: insert 1,050 places in one city; `page=1&pageSize=1000` and `page=2&pageSize=1000` are disjoint and their union is all 1,050. Repeat the same request: identical order.
- Manual check: against a scratch DB with more than 1,000 places in one city (run the migrator with `DATABASE_PATH` pointed at a scratch file and a short insert script), the map's count label shows the full number and search finds a place from the tail.
- `npm test`, `npm run typecheck` green.

## Outcome (2026-10-03)

Done as specified. `GET /api/places` orders by `place.id`; what's-on orders by `start_date, event.id`. `fetchAllPlaces` (`ui/app/lib/api.ts`) fetches page 1, then pages 2…`ceil(total/1000)` in parallel with the query's `signal`, capped at 10 pages with a `console.warn` past it. `usePlaces` uses it, with its query key and `placeholderData` unchanged. The map's count label counts the loaded list, so it is now the full number.

`backend/src/routes/paging.api.test.ts`: 1,050 places in one city; two pages are disjoint, their union is every place, the order repeats, and the rows are sorted by id across the page boundary. That last assertion was added because the brief's repeatability check **passes without the ORDER BY**: SQLite's plain scan follows insertion order today. Verified by removing the ORDER BY: the sorted-order test fails. `npm test` 68 pass + 3 todo, and typecheck is clean. The manual check (scratch DB with more than 1,000 places, map count and tail search) is still owed.
