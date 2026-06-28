# Brief 13 — Public UI/UX interactions

> Written 2026-06-28; **narrowed 2026-06-29** — draw-to-filter split to [brief 15](15-draw-to-filter.md), /admin shell + review UI split to [brief 16](16-admin-shell-and-review-ui.md). This brief is now the **public, place-centric interaction detail**. Companion to [brief 06](06-place-centric-ui.md) (06 = shell/routes; 13 = interaction detail). Builds on [design.md](../../wiki/design.md) (bottom-sheet/side-panel shell locked there). Depends on 03/04/05/06.

## Place panel (place + its events)

- Layout: **place identity at top**, then **events grouped by date** — *Today / This weekend / Later*. Show first ~5, **"show all" expand** for busy venues. Each event row: title, time, **category dot** (EventCategory color), buy-link **only if the source provides one**.
- **Empty state** when a place has no upcoming events (friendly copy, not blank).
- Favorite-star for the place (top) and per-event (event-favorite drives reminders).

## Selection behavior

- Selecting a pin **pans + zoom-to-fits** so the pin clears the panel (desktop right) / bottom sheet (mobile lower third) — never hidden behind chrome.
- Selected pin **scales 32→40px** (design.md), others dimmed.
- **Deep-linkable:** `/places/:id` reflects selection (shareable; also the unified place surface from brief 06).

## Filtering (multi-axis)

- **Primary: PlaceCategory chips** (what kind of place).
- **Secondary: event-timing lens** ("on today" / "this weekend") — **hard-filters (removes)** non-matching places (see Edge cases; overrides the earlier "dim" idea).
- **Draw-to-filter** ([brief 15](15-draw-to-filter.md)) is a third AND constraint when active.
- All filters **AND** together and are shared with the what's-on list view and the map. _The filter state model (the shared store all surfaces read) is owned here; brief 15 plugs the drawn-shape predicate into it._

## What's-on list view

- `/whats-on` = date-grouped list of upcoming events for the current city, **honoring the same active filters** (category, timing, **drawn area**) as the map — a different lens on one filtered dataset.
- Each event **links back to its place on the map**.

## City picker

- **Navbar dropdown**, scoped to **Timișoara / București**. **Default: Timișoara** (or nearest of the two if geolocation granted). Persisted to `locationStore`.
- Switching city **re-centers the map + refetches**. **"Center on me"** is a separate optional button — never required (app fully works without geolocation).

## Auth screens

- **Dedicated routes** `/login` `/register` `/verify` `/reset`, **centered card** on a simple background (not over the map). Verify/reset email links land on these routes. Password-manager + a11y friendly.

## /admin

Split to **[brief 16](16-admin-shell-and-review-ui.md)** (admin shell + ingestion review screen) — separate audience, route tree, and admin gate; not part of the public UI.

## Notifications UI

- **Navbar bell** (logged-in only) with **unread badge** → **dropdown** of items (each links to its place/event on the map), **mark-all-read**, and a link to a **full notifications view**. Matches the in-app inbox + email model (brief 05).

## States & accessibility (every surface)

- **Loading** (skeleton), **empty** (friendly copy + next action), **error** (retry) for: map, place panel, what's-on, admin table, notifications.
- **WCAG AA:** keyboard nav for map pins + panel; focus management on panel/sheet open/close; ARIA for the bell/dropdown and admin table; **4.5:1 contrast** on category colors (design.md already requires); category never conveyed by color alone (pair with icon/label).

## Edge cases & robustness (locked 2026-06-28 — stress-test pass)

These resolve real-world failure modes the happy-path spec glossed over. Several **override** earlier decisions (noted).

- **Pin density → clustering is day-one (legibility, not perf).** At city zoom a full OSM sync is a wall of overlapping pins; category color + event badge are illegible. **Cluster by default** (count bubbles, with an event-presence hint); per-pin **category color + event badge resolve only when zoomed in past overlap.** _Overrides brief 12's "defer clustering until measured slowdown" — this is a legibility requirement, build it here._
- **Timing filter HARD-filters (removes), not dims.** _Overrides decisions.md "dim, don't remove."_ When a timing filter is active, non-matching places are **removed** from the map, with a clear banner ("showing places with events this weekend · **clear**") + a count. Dimming is invisible at density and wastes clicks.
- **Zero-results = guided recovery, never a blank map.** Stacked AND filters (city + category + timing + drawn area) hit zero easily. Overlay: "No places match all filters here", the **active filters as individually-removable chips**, **clear all**, and a hint ("X match if you widen the area / drop the timing filter"). _(The drawn-area chip is contributed by brief 15.)_
- **Favorite while logged-out = login prompt then complete.** The star is **visible** to logged-out users (the hook); tapping opens a contextual login/register ("sign in to save this place"); after auth, the **original favorite completes** and returns the user in place. The retention on-ramp.
- **`/places/:id` cold/shared = full place page + mini-map** (city derived from the place, full event list); **in-app via pin = panel/sheet over the live map.** Two presentations, one route. Mobile sheet is **draggable (peek/half/full)** so the pin isn't hidden.
- **Mobile max-chrome → collapsing chrome.** Minimal top bar (city + bell + menu); **filters + draw collapse into one "Filters" button/sheet** (no always-on chip row); place sheet draggable; attribution behind a tappable "i". Map stays the hero at 375px.

## Acceptance criteria

- Place panel groups events by date with expand + empty state; selection pans/zooms so the pin is visible and `/places/:id` deep-links.
- Filters (category + timing + city, AND-ed, extensible to the drawn-area predicate from brief 15) are shared by map and what's-on.
- Pins cluster at city zoom; category color + event badge resolve when zoomed in.
- City picker defaults to Timișoara, persists, re-centers; app works with geolocation denied.
- Auth screens are dedicated centered-card routes; notification bell + dropdown work.
- Every listed surface has loading/empty/error states and meets WCAG AA.

_(Draw-to-filter criteria → brief 15; /admin + review criteria → brief 16.)_
