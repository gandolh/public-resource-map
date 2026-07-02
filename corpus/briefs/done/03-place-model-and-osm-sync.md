# Brief 03 — Place model & OSM resource sync

> Split from the original brief 02 on 2026-06-28. Depends on **brief 02** (admin gate). Implements [decisions.md → OSM resource ingestion](../../wiki/decisions.md) and the place half of the place-centric model.

## Goal

Introduce the unified **place** as the map's core unit, and populate it for Timișoara + București from **OpenStreetMap** (ODbL — clean, licensed, carries coordinates). This is the resources-first anchor; events (brief 04) attach to these places.

## Scope

- A single `place` table serving both place sources. OSM places are synced here; event-venue places (brief 04) reuse the same table with `source: event-venue`.
- **Admin-triggered "sync OSM for this city"** — bypasses any accept gate (OSM is trusted/licensed; the review gate exists for untrusted scraped data only).
- **Infrequent / on-demand** (~monthly), NOT on the event cadence. Also serves as first load.
- **Upserts `source: osm` rows ONLY** — never clobbers `source: event-venue` places or admin manual pins.

## Data model (Drizzle/SQLite)

- `place` — id, `source` (`osm` | `event-venue`), name, category (`ResourceCategory`), lat, lng, address (nullable), `osmType`/`osmId` (nullable), `isManualPin` (bool), createdAt, updatedAt.

## OSM ingestion mechanics

- **Ingest-once-into-SQLite, serve-from-DB.** Overpass is rate-limited/batch-oriented — never query it on user traffic.
- **Overpass query per city** (bounding box or area id) with tag filters for the resource categories.
- **Tag → `ResourceCategory` map** (explicit table). Examples: `amenity=library`→library, `leisure=park`→park, `amenity=clinic|hospital`/`healthcare=*`→health, `amenity=townhall`→civic, `tourism=museum`→culture. **Unmapped tags bucket into "other"** (visible, not dropped) so gaps surface.
- **Messy features:** polygons → **centroid**; **keep** un-addressed features; **drop** un-named ones (nameless pin = noise).
- **Attribution:** OSM/ODbL attribution shown in the UI (required by licence).

## API (admin-gated)

| Method | Path | Description |
|---|---|---|
| POST | `/api/admin/osm/sync` | run Overpass sync for a city → upsert `source:osm` places |
| GET | `/api/places` | list places for a city (public; powers the map) |
| GET | `/api/places/:id` | single place (public; powers the place panel — events joined in brief 04) |

## Acceptance criteria

- An admin can sync OSM for Timișoara and București; places appear with correct category + coordinates.
- Polygons land at their centroid; un-named features are excluded; unmapped tags appear as "other".
- A re-sync updates `source:osm` places without touching event-venue places or manual pins.
- The public places API serves a city's places fast from SQLite (no live Overpass call).
- OSM/ODbL attribution is present in the UI.
