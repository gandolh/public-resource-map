# Brief 06 — Place-centric map UI (refactor)

> Split from the original brief 02 on 2026-06-28. Depends on **brief 03** (places API), **brief 04** (events on places), **brief 05** (favorite controls + bell). Implements [decisions.md → Map / UI model](../../wiki/decisions.md). This is a **refactor** of the existing event-centric UI, not a new build.

## Goal

Reshape the existing 3-surface UI (`/map` resource markers · standalone `/events` grid · `/resources/:id`) into the **place-centric** model: the map is home, the pin is a place, events live inside a place.

## Scope

- **Pin = place** — `ResourceMarkers` must change to the **icon-led, event-aware, zoom-aware** pin system specced in [design.md → Map Pins](../../wiki/design.md) (per-category SVG icon as primary signal + category color, event-presence accent ring/badge, dot↔teardrop by zoom, clear selected state) and clustered per [brief 13](13-ui-interactions-and-features.md). Basemap: CARTO **Voyager** (light) / DarkMatter (dark) per design.md.
- **Place panel** (on pin-click): place identity (what it is, address, hours) **+ its event list** (each: date, title, **buy-link only if present**) + **favorite-star** for the place and per-event.
- **`/resources/:id` collapses into a unified place surface** — one model whether reached by pin-click (panel) or deep link (full page). Don't maintain two place views.
- **Standalone list reframed:** retire event-centric `/events`; add a citywide **"what's on"** index — all upcoming events across the current city's places, each **linking back to its place on the map**. Same data, date-first lens.
- **City picker** as a **primary Navbar control** — scoped to **Timișoara / București**, defaulting to last choice (persist via existing `locationStore`). Map centers on the selected city (native GPS "center on me" stays optional, not a dependency).
- **Notification bell** + **profile/auth** state in the Navbar (from briefs 05 / 02).
- **Attribution:** OSM/ODbL + per-source event attribution visible.
- **Fonts (per [design.md](../../wiki/design.md) / [decisions.md → Design direction](../../wiki/decisions.md)):** add **Fraunces** (variable serif, Google Fonts) for display/headings + keep **Inter** for body/UI; update `root.tsx` font preload (currently Inter-only) and the Tailwind/CSS font tokens. Apply Fraunces to the `display`/`headline-*` scale, Inter to `body-*`/`label-*`.

## Existing code touched

- `routes/map.tsx`, `routes/events.tsx`, `routes/resources.$id.tsx`, `components/map/ResourceMarkers.tsx`, `components/Navbar.tsx`, `stores/mapFilterStore.ts`, `stores/locationStore.ts`, `lib/api.ts`, hooks. Route config in `app/routes.ts` (rename/repoint `/events`, fold `/resources/:id` into a place route).

## Acceptance criteria

- Map shows place pins colored by category, badged when they have upcoming events; selecting one opens the place panel with the place's events and any buy-links.
- One place surface serves both pin-click and deep-link; no separate resource page.
- "What's on" index lists a city's upcoming events and links each back to its place on the map.
- City picker switches between Timișoara/București, persists, and re-centers the map; the app works without native geolocation.
- Favorite stars and the notification bell are wired; attribution is shown.
