# Open Questions

Only genuinely unresolved questions. Delete an entry the moment it's answered — its history goes in `log.md`. For decided items, see [decisions.md](decisions.md).

> **2026-06-28 — major reframe.** The product pivoted to **place-centric**, **resources-first**, sourcing events from **public primary publishers (API-first, scrape-last)**, NOT from scraping iaBilet (its ToS forbids reuse — see decisions.md → Legal posture). The former "iaBilet specifics / source landscape" content here is now moot and was removed; it lives in `log.md`. The iaBilet adapter survives only as a permission-blocked POC item.

## Event sources — per-publisher discovery (Timișoara + București)

Direction locked (place-centric, public primary publishers, API-first/scrape-last, build **all** per-city adapters — see [decisions.md](decisions.md)). What's open is the concrete per-publisher landscape, resolved as each adapter is built. Full feature spec: [briefs/todo/04-event-ingestion-pipeline.md](../briefs/todo/04-event-ingestion-pipeline.md).

- **Which publishers exist per city, and what's their machine-readable surface?** For each Timișoara/București town hall, museum, and cultural institution: does it expose an **official API**, an **iCal/`.ics`** feed (common + often unadvertised for calendars), **RSS/Atom**, **JSON-LD**, or a clean **sitemap** — before falling back to HTML scraping? Probe in discovery order; record the mechanism on each `event_source`.
- **Per-source terms.** Each publisher's site has its own terms; vet reuse legality individually as each adapter is added (we vet by hand because the source count is large).
- **iaBilet (blocked).** Adapter is POC-only; obtaining explicit permission / an official feed is a hard blocker before any business launch. Do not enable in production.

## Venue ↔ event matching mechanics

Model locked (match event venue → OSM place; ambiguous → admin resolves; unmatched → event-venue place). Open at build time:
- **Match algorithm** — normalize venue string + city, fuzzy-match against OSM place names/addresses. Threshold for "confident match" vs. "ambiguous → admin" vs. "no match → geocode."
- **"Changed" detection granularity** — which event fields (date, price, title) count as a meaningful change that re-enters the diff.

## Geocoding mechanics (fallback path)

Provider + policy locked (Nominatim public, 1 req/s, cache, manual-pin fallback — see decisions.md). Open:
- Address-normalization rules for the `geocode_cache` key (so trivially-different strings hit the same cache row).
- When a geocode result looks plausible-but-wrong (square centroid) — heuristics to route it to the admin manual-pin step rather than accepting silently.

## OSM resource layer mechanics

Ingestion model locked (admin-triggered sync, bypasses accept gate, upserts `source:osm` only, ingest-into-SQLite — see decisions.md). Open:
- **Overpass query shape** per city (bounding box / area id; which tag filters).
- **Tag → `ResourceCategory` mapping table.** OSM tags (`amenity=library`, `leisure=park`, `amenity=clinic|hospital`, `healthcare=*`, `amenity=townhall`, `tourism=museum`…) don't map 1:1 to our enum. Unmapped tags bucket into **"other"** (visible, not dropped) so gaps are seen.
- **Messy-feature handling** — polygons → centroid; keep un-addressed features; drop un-named ones (a nameless pin is noise).

## Spatial indexing

**Should proximity queries use a spatial index?**
- Current bounding-box approximation works for small datasets.
- SQLite has no built-in spatial index; could use `spatialite` or a manual R-tree via `better-sqlite3`.
- Revisit when data volume or query latency becomes an issue (likely once real RO data lands across both cities).
