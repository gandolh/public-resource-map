# Brief 14 — Archived events page

> Written 2026-06-28. Depends on **brief 03** (places persist), **brief 04** (event-archive lifecycle — past events flip to archived, not deleted), **brief 02** (auth) + **brief 05** (favorites) for the personal tab. Builds on the **event-horizon decision** ([decisions.md → Ingestion & data mechanics](../../wiki/decisions.md)) that retains past events. Build **after** the core place/what's-on UI (06/13).

## Goal

A public page where users browse **past events** and see **where each was held** — and, when logged in, **the history of events they favorited** ("what it saved"). The enabling data already exists: events flip to `past`/archived status rather than being deleted.

## Scope

- **Route:** `/archive` (citywide) — public.
- **Two tabs:**
  1. **My past events** (default when logged in) — events the user `favorite_event`d (or whose favorited place hosted them) that have now passed. The personal-history / nostalgia hook ("what it saved"). **Requires auth** — logged-out shows a sign-in prompt for this tab only.
  2. **Citywide archive** — all past events in the **current city** (honors the city picker). Public.
- **Each row links to its place** via `/places/:id` (places persist; reuse the existing place surface — "where it was"). No separate archive map.
- **Date-grouped, most-recent-first**, paginated/lazy-loaded (archives grow). Filter by EventCategory; the city picker scopes the citywide tab.
- **Reuses the place page**, which can also show a "past events here" section for that place.

## Data / queries

- Query events with archived/`past` status (end date < now), scoped by city (citywide tab) or by the user's favorites (personal tab).
- No new tables — uses the `event` status lifecycle + existing `favorite_event` / `favorite_place`.
- Respect the **prune** policy (very old archived rows are pruned — see event-horizon decision); the archive shows what's retained, not literally forever.

## UI / states

- Tabs (My past events / Citywide archive); empty states per tab ("You haven't saved any past events yet" / "No past events recorded for this city yet").
- Loading skeleton; error/retry. WCAG AA (consistent with brief 13 states & a11y).
- A link to `/archive` lives in the Navbar/menu (and optionally from a place page's "past events here").

## Acceptance criteria

- `/archive` shows a citywide list of past events for the current city, date-grouped, category-filterable, each linking to its place.
- Logged-in users see a "My past events" tab of their favorited past events; logged-out users get a sign-in prompt on that tab only.
- Rows link to the persisting place page; no past event is shown that's been pruned.
- Empty/loading/error states + WCAG AA per surface.

## Outcome (2026-10-03)

Done.

- **"Past" is computed, not stored.** `pastAt(now)` sits beside `liveInWindow`
  in `event-window.ts`, built from the same columns: still `live`, and its end
  (or its start, when it has none) is before now. So an event leaves what's on
  exactly when it enters the archive. Nothing ever writes `status = 'past'`, and
  nothing needs to. Cancelled (`ended`) and source-dropped (`stale`) events stay
  out: they did not happen as listed.
- **API** (`routes/archive.ts`):
  - `GET /api/archive?city&category&page&pageSize` is public: newest first by
    when it ended, filterable by event category, paged.
  - `GET /api/archive/mine` (signed in) is the events you saved **and** those
    at places you follow, across cities.
  - Both return what's on's row shape, so each row still opens its place.
- **`/archive`** (`routes/archive.tsx`):
  - Tabs "My past events" and "All of {city}", the latter following the city
    picker. Mine is the default when signed in, and asks for sign-in otherwise.
  - Event-category chips, and month groups, newest first (an archive is read in
    bigger steps than a week). "Show more" pages through.
  - Empty, loading and error states per tab; `role="tablist"` / `tab` /
    `tabpanel` wired with `aria-selected` and `aria-controls`.
  - It links from the desktop nav ("Arhivă") and from what's on's footer ("Past
    events"), which is how a phone reaches it: its tab bar is already full.
- **The row.** What's on's row moved into `components/place/EventPlaceRow.tsx`
  and both pages use it. In the archive it shows the date instead of the time,
  and **no ticket link**, since tickets to something already over are noise.
- **Not built:**
  - **the prune.** decisions.md says very old archived rows are pruned, but no
    prune exists yet, so the archive shows everything retained;
  - the optional "past events here" section on a place page.

**Tests:**
- 4 API tests: newest first; upcoming, running and cancelled excluded; category
  and paging; "mine" needs sign-in and spans saved events and followed places
  but never another person's.
- 2 e2e specs: the signed-out tabs and the sign-in prompt, and the two ways in.
- `npm test` 168, e2e 17, typecheck clean.
- Checked by eye on the reseeded scratch DB: 13 past events in Timișoara under
  "octombrie 2026", ticket links gone.
