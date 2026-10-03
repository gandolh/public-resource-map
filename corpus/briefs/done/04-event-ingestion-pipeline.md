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

## Outcome (2026-10-03)

**The pipeline is built and tested end to end. No real source is configured
yet:** picking and vetting the first 2–4 is the owner's
([todo](../../todos/2026-10-03-vet-first-event-sources.md)).

**Code** (`backend/src/ingest/`, `routes/admin-ingest.ts`, `shared/src/types/ingest.ts`):
- **Adapters** (`adapters.ts`). An adapter only reads its source; everything
  after that is shared.
  - The built-in is a generic **iCal adapter** (`ical.ts`). It is a mechanism,
    not a site: any published `.ics` feed, which is decisions.md's rung 2.
  - It reads UTC, Bucharest-zoned, floating (taken as Bucharest) and all-day
    times. Another time zone, or any recurring event (`RRULE`), is quarantined
    rather than guessed. Feed categories map onto ours by keyword.
  - `adapterKey` is `<adapter>:<slug>` (`ical:centrul-de-proiecte`), so one
    implementation serves many sources under the existing unique index.
  - Each adapter declares `productionAllowed`. One that has not cleared the legal
    posture runs in development only; this is the iaBilet rule. **No iaBilet
    adapter was built.**
- **Validation.** Every row passes `rawEventSchema`. A failure goes to the
  `needs-attention` quarantine with its issues, keyed so it is quarantined once,
  not once per refresh.
- **Venue matching** (`match.ts`).
  - Names are normalized and the room is dropped ("Sala Mare, Casa de Cultură" →
    "casa de cultura"). The city's own name is ignored, since every place shares
    it.
  - The score is the mean of token containment and Dice. **Auto-match** at ≥0.85,
    with a 0.1 lead over the runner-up. **Ambiguous** at ≥0.5, with up to three
    candidates for the admin. Below that, unmatched.
- **Geocoding** (`geocode.ts`), as the fallback for unmatched venues only.
  - Public Nominatim, spaced to 1 req/s however many callers queue, bounded to
    the city's box.
  - It is **off unless `NOMINATIM_USER_AGENT` is set** (the policy requires an
    identifying one). Without it, unmatched venues wait for a manual pin.
  - Each normalized address is asked once, ever (RO abbreviations expanded, the
    city appended), and misses are cached too.
  - A hit becomes a pin only if it is inside the city, more specific than a
    city or district, and above an importance floor that starts at 0, to be
    tuned on real data.
- **Dedup.** Within a source by UID (or URL + start + title). Across sources by
  normalized title + Bucharest day + city, against live events and other
  sources' pending rows.
- **Reconcile** on later refreshes, tiered as decisions.md says:
  - **Back to review** as `changed`: start, end, venue, or a cancellation.
    Accepting a cancellation ends the event.
  - **Silent:** price, currency, description and links.
  - Rejected listings stay rejected.
  - An accepted listing absent longer than the 3-day grace window turns its
    event `stale`, and a relisting revives it.
- **Health.** `lastStatus` is `ok`, `suspect` (zero, or under half of a previous
  run of 4 or more) or `error` (the fetch failed), alongside `lastEventCount`,
  `lastSuccessfulAt` and `lastRunAt`.
- **Accept, reject, resolve.**
  - Accept writes or updates the live event in its own transaction. A row with
    no place is skipped with a reason.
  - An unmatched venue becomes an `event-venue` place on accept, reused by name
    for its later events. A manual pin is marked `isManualPin`.
  - Resolve takes an existing place in the city, or a pin inside its box.
  - The accepted event ids are where brief 05's "new at a favourite place"
    trigger plugs in.
- **API**, all behind `requireAdmin`:
  - `GET`/`POST /api/admin/sources` and `PATCH /:id` (enable or disable);
  - `POST /:id/refresh` and `/refresh-all` (sequential: the geocoder's rate
    limit is shared);
  - `GET /api/admin/staged-events` (pending rows by default, filterable by
    source and status);
  - `POST …/accept`, `…/reject` and `…/:id/place`.

  A refresh answers when it finishes, with no job and poll: geocoding at 1 req/s
  makes a cold refresh slow, which is acceptable for an admin pressing a button.
- **Schema.** Migration `0002_ingestion_keys` adds four columns to
  `staged_event`: `external_key`, `lat`, `lng` and `last_seen_at`, plus an index
  on (source, key). It was generated by drizzle-kit, so the snapshot chain test
  holds. Brief 29's drift fix will now be 0003.

**Tests: 45 new.**
- 9 matcher, 4 iCal, 5 geocoder (including the request spacing and the
  User-Agent), and 3 adapter-over-HTTP against a local server.
- 24 API tests through `buildTestApp` with an injected adapter, geocoder and
  clock: the gate on every route; sources; a refresh hitting every bucket;
  accept, reject and resolve; all four reconcile paths; cross-source dedup;
  health; the production refusal.
- `npm test` 154 + 3 todo; typecheck, build and the e2e suite (13) are green.

**Not done here:**
- the admin UI (brief 16);
- notifications on accept (brief 05);
- the archive (brief 14);
- a periodic prune of very old archived rows (decisions.md's DB-growth note);
- self-hosted Nominatim.
