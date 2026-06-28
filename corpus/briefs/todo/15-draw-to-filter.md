# Brief 15 — Draw-to-filter (spatial map filter)

> Split from [brief 13](13-ui-interactions-and-features.md) on 2026-06-29 — a self-contained feature (a draw plugin + point-in-polygon + a mode toggle that plugs into the shared filter state). Depends on **brief 06** (map) + **brief 13** (the shared filter-state store it ANDs into). Implements [decisions.md → UI interactions & features → Draw-to-filter](../../wiki/decisions.md).

## Goal

Let users **draw a shape on the map** (free-hand or polygon) to filter places/events to those **inside the shape**, composing with the existing filters.

## Behavior

- **Free-hand + polygon** modes; results filtered to **inside the drawn shape**.
- **Client-side point-in-polygon** over the already-loaded city places — instant, no new endpoint, identical for freehand/polygon. (City datasets are modest; fits ingest-once/serve-from-DB.)
- **Composes via AND** with PlaceCategory chips + event-timing + city (plugs the drawn-shape predicate into brief 13's shared filter state). Shows as a **clearable overlay** with a **live result count** ("12 places in this area") and an obvious **clear drawing** control.
- **Ephemeral** (not persisted), **one shape at a time**, with edit/clear. *(Saved per-user areas = future retention hook, deferred.)*

## Edge cases (locked 2026-06-28 stress-test)

- **Draw = explicit mode toggle.** A "draw area" button enters draw mode: **map pan/zoom locked**, touch/cursor draws, **done/cancel** exits; a hint shows while active. Resolves the draw-vs-pan gesture conflict (critical on touch).
- **Drawn-shape lifetime:** persists across **pan/zoom, opening a place panel, and the what's-on view** (it's an active shared filter, shown in both); **cleared on city change** (with a toast — a Timișoara shape is meaningless in București).
- **Contributes its chip** to brief 13's zero-results guided-recovery overlay (a removable "drawn area" filter chip).

## Tooling (locked 2026-06-28 after validation)

- **`@geoman-io/leaflet-geoman-free`** — NOT Leaflet.draw. Leaflet.draw is **unmaintained (last commit 2018) and has no freehand mode** (it literally can't do the requested free-hand draw); Geoman is actively maintained, has a **freehand mode**, supports TypeScript + react-leaflet + Vite.
- **Point-in-polygon:** `@turf/boolean-point-in-polygon` (small, focused) or a hand-rolled ray-cast helper if that's all that's needed.
- Both **exact-pinned** (house style).

## Acceptance criteria

- A draw-mode toggle locks the map and lets the user draw free-hand or polygon; done/cancel exits.
- Drawn shape filters places (and their events) to inside it, client-side, ANDed with the other active filters; a live result count shows.
- Shape persists across pan/zoom/panel/what's-on; clears on city change; is clearable manually; contributes a removable chip to the zero-results overlay.
- Uses `@geoman-io/leaflet-geoman-free` + a point-in-polygon helper, exact-pinned.
