---
summary: Two open items from the source registry (2026-11-12) — the basemap tiles' terms were never read, and per-layer modules wait for a second layer; the 2026-11-04 drops and the iaBilet rule stay settled.
updated: 2026-11-12
---

# Open Questions

Only genuinely unresolved questions. Delete an entry the moment it's answered — its history goes in `log.md`. For decided items, see [decisions.md](decisions.md).

## The basemap tiles' terms (2026-11-12)

The source registry (`shared/src/sources.ts`) found no recorded reading of the OpenStreetMap
tile usage policy (`osm-tiles`) or CARTO's basemap terms (`carto`), so both are
`permission-pending`: used and credited, with a carve-out in `DATA_SOURCES.md`. Someone reads
the two, sets `reuse` and `termsCheckedOn`, and runs `npm run sources`. Before any real
traffic, the OSM tile policy matters most: it caps heavy use of `tile.openstreetmap.org`.

## Per-layer modules (2026-11-12)

The globe app the source registry came from keeps one module per data layer. Not now: prm has
one layer of places, with events inside places, and modules pay off at several layers. Revisit
when a second layer arrives (a transit or air-quality overlay, say).
