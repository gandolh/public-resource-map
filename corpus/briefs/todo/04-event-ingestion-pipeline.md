# Brief 04 — Event ingestion pipeline (refresh / match / geocode / reconcile / diff / accept)

> Split from the original brief 02 on 2026-06-28. Depends on **brief 02** (admin gate) and **brief 03** (place model — events attach to places). Implements [decisions.md → Event ingestion model, Source discovery, Ingestion robustness, Geocoding, Legal posture](../../wiki/decisions.md).

## Goal

Admin configures **public primary-publisher** event sources per city, triggers a **refresh** (per-source or all), and the pipeline fetches → validates → matches each event to a **place** → geocodes fallbacks → dedups → reconciles → produces a **diff**. Admin reviews and **accepts**; only accepted events go live.

## Scope (POC)

- **Cities:** Timișoara + București.
- **Build a FEW (2–4) clean, defensible adapters well** (revised 2026-06-28 — was "build all"). Research confirmed RO sources are almost all bespoke HTML scraping; "all sources" is post-POC expansion. See [decisions.md → Adapter scope](../../wiki/decisions.md).
- **Coverage is intentionally sparse; OSM resources (brief 03) carry the map.** No RO event source is clean + machine-readable + comprehensive at once — POC takes **clean + sparse**.
- **Primary publishers only** — municipal / publicly-funded calendars (Centrul de Proiecte Timișoara, timisoara-info.ro) + individual venues/museums. **Do NOT scrape commercial aggregators** (ZileșiNopți / OneEvent) — recreates the iaBilet ToS problem. **Buy-link shown only if the source provides one.** **Text-only** events (no image; category by color).
- **Discovery order — API-first, scrape-last** (still the rule, but expect HTML in practice): official API → iCal/`.ics` / RSS/Atom / JSON-LD / clean sitemap → HTML scraping. Record `mechanism` per source; always probe upper rungs first even though they're usually empty for RO.
- **iaBilet adapter: POC-only, disabled in production** (ToS forbids reuse — permission is a launch blocker).

## Pipeline (per refresh)

1. **Fetch** via discovered mechanism (polite rate limit; prefer API/feed).
2. **Parse** into the shared `Event` shape (name, url, dates, description, venue string, optional buy-url; no image).
3. **Sanity-validate** with `shared/` Zod (title non-empty, date plausible/future-ish, venue present). Failures → **needs-attention** quarantine.
4. **Match venue → place:** fuzzy-match venue+city against OSM places → reuse coords. **Ambiguous → admin resolves** (no auto-merge). **No match → create event-venue place** (geocode, or manual-pin if un-geocodable).
5. **Geocode (fallback only):** Nominatim public — **1 req/s**, identifying User-Agent, `geocode_cache` per normalized address. Un-geocodable → flag for **manual pin**, never drop.
6. **Dedup:** within-source (canonical url/id) + cross-source (normalized title + startDate + venue/city). Before the diff.
7. **Reconcile (not append-only):** new → `new`; changed (date/price) → `changed` (re-confirm); vanished accepted → `stale`/`ended` (grace window).
8. **Diff:** staged preview grouped by source — new / changed / stale + ambiguous-match + needs-attention buckets. Nothing live yet.
9. **Accept/reject** (individual + bulk); resolve ambiguous matches; drop manual pins. Only accepted → live. **On accept, fire notifications** (brief 05).

## Per-source health

`lastStatus`, `lastEventCount`, `lastSuccessfulAt`. A run returning **0 / a large drop** → flag **`suspect`**, surfaced loudly (catches hard breaks from redesigns).

## Data model (Drizzle/SQLite)

- `event_source` — id, name, city, homepageUrl, adapterKey, **mechanism** (api/ical/rss/jsonld/sitemap/scrape), enabled, lastStatus, lastEventCount, lastSuccessfulAt.
- `staged_event` — source ref, raw payload, matched/created place ref, geocoded coords, dedup key(s), `status` (`new`|`changed`|`stale`|`accepted`|`rejected`|`needs-attention`), firstSeenAt.
- `geocode_cache` — normalized address → coords.
- live `event` — FK to `place`, dedup-key columns/index, `status` for stale/ended, optional buyUrl.

## API (admin-gated)

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/sources` | sources + health |
| POST | `/api/admin/sources/:id/refresh` | run one source → diff summary |
| POST | `/api/admin/sources/refresh-all` | run all enabled |
| GET | `/api/admin/staged-events` | current diff (filter by source/status/bucket) |
| POST | `/api/admin/staged-events/accept` | accept by ids (bulk) → triggers notifications |
| POST | `/api/admin/staged-events/reject` | reject/ignore by ids (bulk) |
| POST | `/api/admin/staged-events/:id/place` | resolve ambiguous match / set manual-pin coords |

Long refreshes: job id + poll, or stream — TBD at build.

## Acceptance criteria

- Refresh per-source and all; each source records mechanism + health; `suspect` flag on 0/big-drop.
- Diff shows new/changed/stale without writing live; duplicates filtered before review.
- Every event resolves to a place (OSM match / geocoded event-venue / manual pin); un-geocodable flagged, never dropped; ambiguous → admin.
- Accept/bulk-accept + reject/bulk-reject; only accepted events public; malformed rows quarantined.
- All endpoints reject non-admins; iaBilet adapter disabled in production.
