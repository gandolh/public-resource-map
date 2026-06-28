# Brief 13 — UI/UX interactions & features

> Written 2026-06-28 from a full grilling pass + research. Companion to [brief 06](06-place-centric-ui.md) (the structural refactor): **06 = the shell/routes; 13 = the interaction detail + two new features (draw-to-filter, /admin shell).** Builds on [design.md](../../wiki/design.md) (bottom-sheet/side-panel shell already locked there). Depends on 03/04/05/06.

## Place panel (place + its events)

- Layout: **place identity at top**, then **events grouped by date** — *Today / This weekend / Later*. Show first ~5, **"show all" expand** for busy venues. Each event row: title, time, **category dot** (EventCategory color), buy-link **only if the source provides one**.
- **Empty state** when a place has no upcoming events (friendly copy, not blank).
- Favorite-star for the place (top) and per-event (event-favorite drives reminders).

## Selection behavior

- Selecting a pin **pans + zoom-to-fits** so the pin clears the panel (desktop right) / bottom sheet (mobile lower third) — never hidden behind chrome.
- Selected pin **scales 32→40px** (design.md), others dimmed.
- **Deep-linkable:** `/places/:id` reflects selection (shareable; also the unified place surface from brief 06).

## Filtering (two-axis + draw)

- **Primary: PlaceCategory chips** (what kind of place).
- **Secondary: event-timing lens** ("on today" / "this weekend") — **dims places with no matching events** rather than removing the place.
- **Draw-to-filter** (NEW, see below) is a third AND constraint.
- All filters **AND** together and are shared with the what's-on list view.

## Draw-to-filter (NEW feature)

- **Free-hand + polygon** drawing over the map; results are filtered to **inside the drawn shape**.
- **Client-side point-in-polygon** over the already-loaded city places (Turf.js or a small helper) — instant, no new endpoint, identical for freehand/polygon. (City datasets are modest; fits ingest-once/serve-from-DB.)
- **Composes via AND** with category + event-timing + city filters. Shape renders as a **clearable overlay** with a **live result count** ("12 places in this area") and an obvious **clear drawing** control.
- **Ephemeral** (not persisted), **one shape at a time**, with edit/clear. *(Saved per-user areas = noted future retention hook, deferred.)*
- **Tooling: `@geoman-io/leaflet-geoman-free`** (locked 2026-06-28 after validation — NOT Leaflet.draw). Rationale: Leaflet.draw is **unmaintained (last commit 2018) and has no freehand mode** — it literally can't do the requested free-hand draw; Leaflet-Geoman is actively maintained, has a **freehand mode**, and supports TypeScript + react-leaflet + Vite. Exact-pinned (house style). Point-in-polygon: `@turf/boolean-point-in-polygon` (small, focused) or a hand-rolled ray-cast helper if that's all that's needed.

## What's-on list view

- `/whats-on` = date-grouped list of upcoming events for the current city, **honoring the same active filters** (category, timing, **drawn area**) as the map — a different lens on one filtered dataset.
- Each event **links back to its place on the map**.

## City picker

- **Navbar dropdown**, scoped to **Timișoara / București**. **Default: Timișoara** (or nearest of the two if geolocation granted). Persisted to `locationStore`.
- Switching city **re-centers the map + refetches**. **"Center on me"** is a separate optional button — never required (app fully works without geolocation).

## Auth screens

- **Dedicated routes** `/login` `/register` `/verify` `/reset`, **centered card** on a simple background (not over the map). Verify/reset email links land on these routes. Password-manager + a11y friendly.

## /admin shell (NEW — separate contextual menu)

- `/admin` uses its **own layout** (distinct from the public Navbar): a **sidebar nav** — *Sources, Review queue, Places, (later) Users* — plus an **"exit to public site"** link and the admin's identity.
- **Route-lazy-loaded** (brief 12) so public users never download admin code. Behind the admin gate (brief 02).
- **Review screen** (the ingestion heart): a **dense, sortable/filterable table** grouped by source→status, **per-row checkboxes + sticky bulk-action toolbar** (bulk accept/reject). Row click → **detail drawer** with full fields, a **small map preview** of the geocoded/matched location, and the **ambiguous-match resolver**. Buckets (new/changed/stale/ambiguous/needs-attention) as table filters/tabs.
- **Review-at-scale = confidence-sorted** (a "refresh all" can stage hundreds): **high-confidence rows** (auto-matched place, clean fields, not duplicate-ish) are **pre-selected for one-click bulk accept**; **low-confidence buckets** (ambiguous match, needs-attention, geocode-failed, `changed`) are **surfaced first** for individual attention. The reviewer spends judgment only where it's needed — scales curation without rubber-stamping.

## Notifications UI

- **Navbar bell** (logged-in only) with **unread badge** → **dropdown** of items (each links to its place/event on the map), **mark-all-read**, and a link to a **full notifications view**. Matches the in-app inbox + email model (brief 05).

## States & accessibility (every surface)

- **Loading** (skeleton), **empty** (friendly copy + next action), **error** (retry) for: map, place panel, what's-on, admin table, notifications.
- **WCAG AA:** keyboard nav for map pins + panel; focus management on panel/sheet open/close; ARIA for the bell/dropdown and admin table; **4.5:1 contrast** on category colors (design.md already requires); category never conveyed by color alone (pair with icon/label).

## Edge cases & robustness (locked 2026-06-28 — stress-test pass)

These resolve real-world failure modes the happy-path spec glossed over. Several **override** earlier decisions (noted).

- **Pin density → clustering is day-one (legibility, not perf).** At city zoom a full OSM sync is a wall of overlapping pins; category color + event badge are illegible. **Cluster by default** (count bubbles, with an event-presence hint); per-pin **category color + event badge resolve only when zoomed in past overlap.** _Overrides brief 12's "defer clustering until measured slowdown" — this is a legibility requirement, build it here._
- **Timing filter HARD-filters (removes), not dims.** _Overrides decisions.md "dim, don't remove."_ When a timing filter is active, non-matching places are **removed** from the map, with a clear banner ("showing places with events this weekend · **clear**") + a count. Dimming is invisible at density and wastes clicks.
- **Draw = explicit mode toggle.** A "draw area" button enters draw mode: **map pan/zoom locked**, touch/cursor draws, **done/cancel** exits; a hint shows while active. Resolves the draw-vs-pan gesture conflict (critical on touch).
- **Drawn-shape lifetime:** persists across **pan/zoom, opening a place panel, and the what's-on view** (it's an active shared filter, shown in both); **cleared on city change** (with a toast — a Timișoara shape is meaningless in București).
- **Zero-results = guided recovery, never a blank map.** Stacked AND filters (city + category + timing + drawn area) hit zero easily. Overlay: "No places match all filters here", the **active filters as individually-removable chips**, **clear all**, and a hint ("X match if you widen the area / drop the timing filter").
- **Favorite while logged-out = login prompt then complete.** The star is **visible** to logged-out users (the hook); tapping opens a contextual login/register ("sign in to save this place"); after auth, the **original favorite completes** and returns the user in place. The retention on-ramp.
- **`/places/:id` cold/shared = full place page + mini-map** (city derived from the place, full event list); **in-app via pin = panel/sheet over the live map.** Two presentations, one route. Mobile sheet is **draggable (peek/half/full)** so the pin isn't hidden.
- **Mobile max-chrome → collapsing chrome.** Minimal top bar (city + bell + menu); **filters + draw collapse into one "Filters" button/sheet** (no always-on chip row); place sheet draggable; attribution behind a tappable "i". Map stays the hero at 375px.

## Acceptance criteria

- Place panel groups events by date with expand + empty state; selection pans/zooms so the pin is visible and `/places/:id` deep-links.
- Filters (category + timing + drawn area + city) AND together and are shared by map and what's-on.
- Draw-to-filter works free-hand and polygon, client-side, ephemeral, clearable, with a result count.
- City picker defaults to Timișoara, persists, re-centers; app works with geolocation denied.
- `/admin` has its own sidebar shell, is lazy-loaded + gated, and the review table supports bulk accept/reject + row detail + map preview + ambiguous resolution.
- Auth screens are dedicated centered-card routes; notification bell + dropdown work.
- Every listed surface has loading/empty/error states and meets WCAG AA.
