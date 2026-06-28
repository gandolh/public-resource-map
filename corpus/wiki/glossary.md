# Glossary

Project-specific terms and jargon. New to the corpus? Read this alongside [overview.md](overview.md).

## Domain model

| Term | Meaning |
|---|---|
| **Place** | The map's core unit. A point that is a public resource and/or an event host. Two sources: `osm` and `event-venue`. Pins on the map are places. |
| **OSM place** | A place sourced from OpenStreetMap (`source: osm`) — park, library, clinic, museum, town hall. Carries real coordinates. The clean, licensed anchor layer. |
| **Event-venue place** | A place created on demand (`source: event-venue`) when an event's venue can't be matched to an existing OSM place. Its coordinates come from geocoding (or a manual pin). |
| **Event** | Something happening at a place (exhibition, concert, public meeting). Attaches to a place via FK. Text-only (no image); shows a buy-link only if the source provides one. |
| **Manual pin** | An admin-placed coordinate for a venue that couldn't be geocoded. Never overwritten by an OSM re-sync. |

## Data sourcing

| Term | Meaning |
|---|---|
| **OSM** | [OpenStreetMap](https://www.openstreetmap.org) — the free, crowd-sourced world map. Our resource data source. |
| **ODbL** | Open Database License — OSM's licence. Permits reuse *with attribution* (hence brief 09). The reason OSM is legally clean for us. |
| **Overpass** | The [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API) — queries OSM for features in an area. Rate-limited/batch-oriented → we **ingest once into SQLite**, never query it on user traffic. |
| **Nominatim** | OSM's geocoder (address → coordinates). Used as a **fallback only** (after OSM-place matching), 1 req/s, cached. |
| **Geocoding** | Turning a venue address string into lat/lng. Needed only for event-venue places that don't match an OSM place. |
| **Primary publisher** | A source that *originates* event info (a museum, a town hall) — vs. an aggregator. We source from these (legally defensible), not from scraping aggregators. |
| **Adapter** | A per-source parser that fetches + extracts events into our `Event` shape. Discovery order: API → feed (iCal/RSS/JSON-LD) → HTML scrape (last). |
| **iaBilet (POC-only)** | A Romanian ticketing aggregator. Its ToS forbids reuse → its adapter is proof-of-concept only, disabled in production, blocked on permission. See [decisions.md → Legal posture](decisions.md). |

## Ingestion pipeline

| Term | Meaning |
|---|---|
| **Refresh** | An admin-triggered run of a source adapter: fetch → parse → match → geocode → dedup → reconcile → diff. Writes nothing live until accepted. |
| **Staged event** | A parsed-but-not-yet-accepted event. Lives in `staged_event` until an admin accepts or rejects it. |
| **Diff** | The preview an admin reviews: new / changed / stale events, plus ambiguous-match and needs-attention buckets. |
| **Dedup** | Dropping duplicates within a source (canonical url/id) and across sources (normalized title + date + venue/city). Runs before the diff. |
| **Reconcile** | On re-refresh: vanished accepted events → `stale`; changed ones → re-enter the diff. (Not append-only.) |
| **Suspect** | A source-health flag raised when a refresh returns 0 / a big drop vs. last run — catches a silently-broken adapter. |
| **Admin-curated** | The model: a human reviews + accepts before anything goes live. NOT an autonomous cron. |

## App / retention

| Term | Meaning |
|---|---|
| **City picker** | Primary nav control; scopes the map to Timișoara or București. Persisted in `locationStore`. |
| **What's on** | The citywide event index (reframed from the old standalone `/events`); lists upcoming events, each links back to its place. |
| **favorite_place / favorite_event** | The two favorite types. Place-favorites drive "new here" notifications; event-favorites drive day-before reminders. |
| **Reminder sweep** | The once-a-day in-process job (inside Fastify) that creates day-before reminders, in Europe/Bucharest time, idempotently. |

## Corpus / process

| Term | Meaning |
|---|---|
| **Corpus** | This `corpus/` directory — the LLM-maintained project knowledge base + work lifecycle. |
| **Brief** | A numbered work spec (`briefs/todo/NN-slug.md`). Numbers are **stable** and ≠ build order. |
| **Wiki** | The synthesis layer (`wiki/`) — LLM-curated pages answering "what is X". |
| **Decision (locked)** | A choice in [decisions.md](decisions.md) not to be relitigated without an explicit revisit + log entry. |
