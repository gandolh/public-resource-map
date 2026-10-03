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

## Outcome (2026-10-03)

Done, with one deviation from the locked tooling, recorded in decisions.md.

**No Geoman.** `@geoman-io/leaflet-geoman-free` 2.20.2 has **no freehand mode**:
`Freehand` and `drawFreehand` are Pro-only (marked ⭐ in its own `.d.ts`), and
the free bundle never mentions them. The 2026-06-28 validation was wrong on the
one point it was chosen for. Its polygon tool also has no public way to finish
from our own Done button; only Enter or private methods do that. Both modes are
therefore hand-rolled on plain Leaflet in `components/map/AreaDraw.tsx`:
- **Freehand:** pointer events on the map container, sampled every 3 px, then
  simplified with Leaflet's own `LineUtil.simplify` (Douglas–Peucker, 2 px).
- **Polygon:** map clicks place the corners. Tapping the first corner, Done or
  Enter closes the shape, and Undo drops the last corner.

That avoids a roughly 4 MB dependency. Point-in-polygon is a hand-rolled even-odd
ray cast (`lib/area.ts`), which the brief allowed; no turf. Nothing new was
installed.

**What shipped:**
- **Store.** `area`, `drawMode` and a one-off `notice` live in `appStore`. The
  area counts in `hasFilters` and `clearFilters`. `setCity` and `adoptCity` clear
  it on a real city change and raise the `areaCleared` notice, which
  `NoticeToast` shows in the shell for 5 s.
- **Draw mode.** It locks dragging, touch zoom, double-click zoom, scroll and
  keyboard. `touch-action: none` keeps a touch drag from being taken as a page
  pan, and pins stop taking clicks. The filter chrome steps aside for a draw bar
  (hint, Freehand/Polygon, Undo, Done, Cancel; Escape cancels).
- **Entry.** "Draw an area" sits in the desktop filter card and the mobile
  filters panel. Once there is an area, it becomes a removable "Drawn area" chip
  plus Redraw. "Edit" is Redraw: vertex editing was Geoman's and is not built.
  The mobile filter badge counts the area.
- **Map.** Places are filtered by `inArea` alongside search. The count reads
  "N places in this area", and the zero-results overlay names the area and
  offers its removable chip.
- **What's-on.** With an area it pages through every page (`fetchAllWhatsOn`,
  100 per page, a 10-page cap), filters by `item.place.coordinates`, and counts
  what it shows. It also shows the removable chip.
- **Tests.** `ui` has its first Vitest project (pure `app/lib` tests, node), in
  the workspace: 7 point-in-polygon cases (box, concave U, winding, bow tie, too
  few vertices, no area).

**Acceptance:**
- typecheck, `npm test` (111 + 3 todo) and `npm run build` are green.
- Browser, desktop, on a scratch copy of the dev DB reseeded so the synthetic
  events are upcoming:
  - A freehand circle showed "16 locuri în zonă".
  - A polygon (closed by tapping its first corner) cut 46 places / 6 with events
    to 14 / 4.
  - What's-on went from 7 events to 5. Parcul Rozelor, south of the Bega, was
    outside the shape and dropped out.
  - Switching to București removed the chip and showed "Zona desenată a fost
    ștearsă: era în alt oraș."
- **Not browser-checked:** a phone viewport, and a real touch stroke. The strokes
  were synthetic pointer events, and the touch path rests on `touch-action:
  none`.
