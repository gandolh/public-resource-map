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
