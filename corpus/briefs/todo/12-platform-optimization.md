# Brief 12 — Platform optimization (map, DB, frontend)

> Written 2026-06-28 from online research (sources in [research todo](../todos/2026-06-28-optimization-research.md)). A grab-bag of **targeted, evidence-based** optimizations. Most are cheap; apply opportunistically alongside the feature briefs rather than as one big pass. **Do NOT pre-optimize** — several only matter once real RO data volume lands (brief 08). Each item notes its trigger.

## Database (better-sqlite3)

The single biggest, cheapest win — set connection PRAGMAs at startup. **Apply now** (do once, in the DB init):

- **`PRAGMA journal_mode = WAL`** — concurrent reads don't block on writes; the biggest single perf improvement for a web workload. Required-ish given the admin refresh writes while users read.
- **`PRAGMA synchronous = NORMAL`** — with WAL, safe + much faster (skips most fsyncs). Tiny risk of losing the *last* commit on power loss, never corruption. Acceptable for this app; revisit to `FULL` only if a lost last-write is unacceptable.
- **`PRAGMA foreign_keys = ON`** — off by default in SQLite; we have real FKs (event→place, favorites→user) and want them enforced.
- **`PRAGMA busy_timeout = 5000`** — avoid spurious "database is locked" under the admin-write / user-read overlap.
- **Use prepared statements** (better-sqlite3 `.prepare()` once, reuse) for hot queries — up to ~1.5x throughput. Drizzle does this; ensure hot paths aren't re-preparing.
- **Deployment note (WAL caveat):** WAL needs all processes on the **same host** sharing memory — fine for our single-VPS + host-volume design; **do NOT** put `app.db` on a network FS or share across hosts. (Already aligned with the deployment decision.)

## Spatial / proximity queries

Current model is a bounding-box approximation (decisions.md). **Trigger: real RO data lands (brief 08) and/or query latency shows up.**

- **Add a composite index on `(lat, lng)`** (and on `place.city`) so the bounding-box filter is index-backed, not a table scan.
- If bounding-box proves insufficient at scale, the documented upgrade is an **R-tree virtual table** (SQLite's built-in `rtree` module via better-sqlite3) — keep as a noted option, not built now (matches the open-questions stance).
- Filter places **server-side by the selected city + viewport bbox** — never ship the whole city's places and filter client-side.

## Map rendering (Leaflet)

**Trigger: a city's place count makes the map sluggish** (likely once full OSM sync lands — hundreds–thousands of pins). Until then, plain markers are fine.

- **Marker clustering** — combine nearby pins into count badges. `Leaflet.markercluster` is the standard; sufficient for our scale (it only struggles past ~100k). Use `chunkedLoading` so adding many markers doesn't freeze the UI. **NOTE (2026-06-28, stress-test): clustering is no longer deferred — it moved to [brief 13](13-ui-interactions-and-features.md) as a day-one *legibility* requirement** (a full OSM sync is an illegible wall of pins at city zoom, independent of perf). This brief retains the *perf* aspects (chunkedLoading, canvas); the clustering *behavior* (zoom-gated category/badge detail) is specced in brief 13.
- **Render only in-viewport markers** — query the backend by current map bounds (ties to the spatial index above); don't hold off-screen pins in the DOM.
- **Canvas renderer for markers** (`L.canvas()` / `preferCanvas: true`) — browsers move a few canvas tiles far faster than thousands of DOM nodes. Tradeoff: less flexible per-marker DOM styling — but our pins are category-color + event-badge, which canvas handles fine.
- **Fastest marker updates:** on filter/city change, `clearLayers()` + `addLayers(batch)` rather than per-marker add/remove (~10x faster).

## Frontend / SPA

- **Tile choice already good** (CARTO Positron/DarkMatter are lightweight). Keep tile attribution (brief 09).
- **Debounce map-pan/zoom → bbox refetch** (e.g. 250–300ms) so dragging doesn't spam the API; pair with TanStack Query caching keyed by `(city, bbox, filters)`.
- **Code-split heavy routes** — the admin ingestion UI (brief 04/06) is admin-only; lazy-load it so public users never download it. React Router 8 supports route-level lazy.
- **Leaflet is ~140KB** — already a dep; ensure it's not double-bundled; import only what's used.

## Explicitly NOT now (avoid premature optimization)

- No R-tree, no supercluster, no canvas rewrite until measured need.
- No CDN / edge / read-replicas — single-VPS scale doesn't warrant it.
- No service worker / offline (separate concern; not perf).

## Acceptance criteria (apply incrementally)

- DB connection sets WAL + NORMAL + foreign_keys + busy_timeout at startup; verified via a quick `PRAGMA` read in a test.
- `(lat,lng)` + `city` indexes exist on `place`; proximity queries are index-backed (check `EXPLAIN QUERY PLAN`).
- Map fetches places by city + viewport bbox (server-side), debounced; not all-then-filter-client-side.
- Clustering + canvas + clearLayers/addLayers introduced **only when** a measured slowdown appears, and documented when they are.
- Admin UI is route-lazy-loaded (not in the public bundle).
