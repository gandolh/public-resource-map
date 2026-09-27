# Brief 19 — Show in-progress events (window overlap, not "starts after now")

> Written 2026-09-27 from the [improvements audit](../../todos/2026-09-27-improvements-audit.md) (#2). **Depends on 18** (shares `places.ts`; different handlers).

## Context

Every user surface asks "does the event **start** inside the window?", and every window starts at `now` (`backend/src/lib/time.ts:103-125`):

| Surface | Predicate | Where |
|---|---|---|
| pin badge `upcomingEventCount` + lens hard-filter | `status='live' AND start_date BETWEEN from AND to` | `backend/src/routes/places.ts:54-67` |
| place panel programme | same | `backend/src/routes/places.ts:156-168` |
| citywide what's-on | same | `backend/src/routes/whats-on.ts:35-39` |

So an event vanishes from the map, the panel, the list and both lenses **the instant it starts**.

**Failure scenarios**
- A temporary exhibition runs 2026-09-01 → 2026-11-30 with status `live`. From its opening minute to its closing day it is invisible everywhere: no pin badge, not in the panel, not in what's-on, not under "today" or "this weekend". Temporary exhibitions are the flagship event type ([overview.md](../../wiki/overview.md)).
- A concert today 19:00–22:00 disappears from "today" at 19:00:01.

The locked lifecycle says the opposite: *"When an event's **end** passes it flips to past/archived status (excluded from those surfaces)"* ([decisions.md → Event horizon / recency](../../wiki/decisions.md)). The seed hides the bug: all 14 synthetic events have `endDate: null` (`backend/src/db/seed.ts:326`) and start relative to now.

The UI has the same flaw one layer up. `groupFor` (`ui/app/lib/dates.ts:37-52`) buckets by **start** day, so an exhibition that opened three weeks ago lands in "Later". `EventRow` (`ui/app/components/place/EventList.tsx:13-44`) shows the start day and time.

## Files you OWN
- `backend/src/routes/event-window.ts` (new) — the one shared predicate
- `backend/src/routes/places.ts` — `upcomingCountExpr` and the `/places/:id/events` query only
- `backend/src/routes/whats-on.ts` — the `conditions` block only
- `backend/src/routes/in-progress.api.test.ts` (new)
- `backend/src/db/seed.ts` — add one event
- `ui/app/lib/dates.ts`, `ui/app/components/place/EventList.tsx`, `ui/app/routes/whats-on.tsx` (row + grouping call)
- `ui/app/lib/i18n.tsx` — new keys only

## Files you must NOT touch
- `lensWindow` in `backend/src/lib/time.ts`. The windows are right; the predicate applied to them is wrong.
- `backend/src/routes/events.ts` (CRUD/proximity endpoint, not a user surface).
- The POST/DELETE handlers (brief 18), and the `/places` list ordering/paging (brief 20).

## What to do
1. **One predicate, three callers.** In `event-window.ts` export a Drizzle condition builder, e.g. `liveInWindow(from, to)` = `status = 'live' AND start_date <= to AND coalesce(end_date, start_date) >= from`. Use it in all three queries, so map, panel and list cannot drift. The what's-on header comment promises exactly that.
2. **Null end date = a point event.** It stays visible until its start, then drops out, the same as today. Write this down in a comment; it is a deliberate choice, not an accident.
3. **Horizon unchanged:** `all` still means `to = now + 90 days`. Ordering stays `start_date ASC`, so running events sort first.
4. **UI grouping.** Change `groupFor`/`groupByDay` to take the end date as well. An event with `start <= now <= end` belongs to **"today"**. Update both call sites (`EventList.tsx:98`, `whats-on.tsx:99`).
5. **UI row.** For a running event that has an end date, show "until {day month}" (RO: "până pe {…}") instead of the start time, in `EventRow` and the what's-on row. Add the i18n keys beside the existing event keys in `i18n.tsx`.
6. **Seed.** Add one synthetic multi-week exhibition at a seeded museum: started about 14 days ago, ends about 40 days ahead, marked synthetic like the others. The demo then exercises the path.
7. **Tests** (`buildTestApp()`, dates relative to `Date.now()` like the existing API tests):
   - exhibition started 10 days ago, ends in 20 days → counted in `upcomingEventCount` for `all`, `today` and `weekend`; listed by `/places/:id/events` and `/whats-on`; its place survives the `today` lens hard-filter
   - event that ended yesterday → excluded everywhere
   - null-end event that started 1 minute ago → excluded
   - event starting in 100 days → excluded from `all` (horizon unchanged)

## Acceptance
- All four test cases pass; the existing lens and what's-on tests pass unchanged.
- In the running app (`npm run dev` after re-seeding), the seeded exhibition shows in its museum's panel under **Today** with "until …", and in what's-on.
- `npm test`, `npm run typecheck` green.
- [decisions.md → Public API surface](../../wiki/decisions.md) gets one line: events are shown while `now` is inside `[start, end]`.
