# Brief 07 — Schema consolidation & migration plan

> Written 2026-06-28. **Build order: this comes FIRST, before briefs 03/04/05** (numbering is stable and ≠ build order — see [CLAUDE.md](../../CLAUDE.md)). Briefs 03/04/05 each introduce tables; this brief owns the *single coherent* data model + migration so they don't collide.

## Goal

Reconcile the **existing NYC-era schema** (`resource`, `event` as standalone, event-centric) with the **place-centric model** the new briefs require. Produce one consolidated Drizzle schema + a clean migration path, so 03 (places/OSM), 04 (ingestion), and 05 (favorites/notifications) build on a settled foundation instead of each bolting on tables.

## Why a dedicated brief

Without this, three briefs independently add overlapping tables and FKs (place vs. resource, event→place FK, dedup keys, staged vs. live). That yields migration churn and contradictory shapes. Consolidate once.

## The reconciliation

- **`resource` → `place`.** The old `resource` becomes the `place` table (brief 03), gaining `source` (`osm` | `event-venue`), `osmType`/`osmId`, `isManualPin`. Old NYC resources are dropped (replaced by RO seed, brief 08).
- **`event` gains a FK to `place`** and a `status` (`live` | `stale` | `ended` | `past`), optional `buyUrl`. No longer standalone with an embedded address — the address/coords live on its `place`. (`past`/archived powers brief 14; events aren't deleted when they end — see event-horizon decision.)
- **New tables** (owned by their briefs, but defined coherently here): `user`/`session`/`verification_token`/`reset_token` (02); `event_source`/`staged_event`/`geocode_cache` (04); `favorite_place`/`favorite_event`/`notification`/**`notification_event`** (05).
- **`notification` is NOT keyed on a single event** (revised — stress-test): a `new-event` notification is **coalesced per (place, accept-batch)** and links to many events via the **`notification_event`** join; a `reminder` is per-event. See brief 05 for the exact columns. Brief 07 just ensures both tables + their indexes exist coherently.
- **Dedup keys** on `event` (normalized-title + startDate + place/city) with an index, used by 04.

## Shared types (`shared/`)

- Rename/replace `Resource` → `Place` Zod schema; add `source` discriminator (`osm` | `event-venue`).
- **Two category enums** (revised — was "keep ResourceCategory"): `PlaceCategory` (library/park/clinic/museum/townhall/…) on `place`, and the existing `EventCategory` on `event`. Define both in `shared/` via Zod `z.enum`. _Note: an `EventCategory` enum already exists in `shared/src/types/event.ts` (concert/theater/sport/community/festival/exhibition/workshop/other) — reuse/extend it, don't recreate; `ResourceCategory` exists in `resource.ts` and is renamed/reshaped to `PlaceCategory`._
- `Event` schema gains `placeId`, `status` (live/stale/ended/past), optional `buyUrl`; drop standalone address fields (moved to `Place`).
- **`shared/` already uses Zod + `z.infer`** (not "pure types") — this brief reshapes existing schemas, it doesn't introduce Zod. Bump downstream imports (ui/backend) — a breaking shared-package change; do it in one pass.
- **Import-extension convention (see decisions.md → Code conventions):** keep `.js` suffixes in `shared/` + `backend/` source (Node ESM runtime requires them); UI stays extensionless (Vite). Do NOT strip `.js` from backend/shared imports.

## Sequencing note

This brief is built **first** and creates the **full table set** (places, events, users/sessions/tokens, sources, staged events, geocode cache, favorites, notifications + join) in one coherent migration. Later briefs then build the *logic/UI* on top of already-existing tables: 02 = auth logic on `user`/`session`/tokens; 03 = OSM sync into `place`; 04 = pipeline into `event_source`/`staged_event`; 05 = favorites/notifications logic. So a later brief should never need a structural migration — only data + behavior. (If one does, that's a signal this brief missed a column.)

## Migration strategy

- **POC stance: a clean reset is acceptable** (no production data to preserve; DB file is gitignored). Prefer a **fresh consolidated migration** over incremental ALTERs — simpler and the seed (brief 08) repopulates.
- Regenerate Drizzle migration(s); `db:migrate` from empty must produce the full consolidated schema.
- Document the new ERD in `wiki/architecture.md` after landing.

## Schema design decisions (locked 2026-06-28)

- **PKs: `randomUUID()` text on every table** (consistent FKs, per locked decision) **+ unique constraints on natural keys**: `place` unique `(osmType, osmId)` where `source='osm'`; `geocode_cache` unique `(normalizedAddress)`; `favorite_place` unique `(userId, placeId)`; `favorite_event` unique `(userId, eventId)`; `notification` unique `(userId, eventId, kind)`. DB-enforced dedup.
- **No universal `deletedAt`. Lifecycle via status enums.** `event.status` (live/stale/ended), `staged_event.status` (new/changed/accepted/rejected/needs-attention), `event_source.enabled` (bool). Hard-delete only truly transient rows. Avoids soft-delete-leak bugs; matches the reconcile model.
- **Two category enums** (not one): `PlaceCategory` (library/park/clinic/museum/townhall/…) and `EventCategory` (concert/exhibition/theater/workshop/…). Defined in `shared/` via Drizzle `{ enum: [...] }`; color-coding applies per-enum.
- **Match state on `staged_event`:** `placeId` (nullable until resolved) + `matchStatus` (auto-matched | ambiguous | unmatched | manual). Ambiguous candidates in a JSON column (or a small `staged_match` table). On accept, the resolved `placeId` is copied to the live `event`.
- **Dates: UTC ISO 8601 strings** (`startDate`, `endDate?`, `createdAt`, `updatedAt`). Convert to **Europe/Bucharest only at compute/display** (reminder sweep, today/weekend grouping). TZ logic centralized, never in storage.
- **FK indexes** on every foreign key (event→place, favorites→user/place/event, staged_event→source/place) per Drizzle relation-performance guidance.
- **Spatial:** composite index on `place (lat, lng)` and on `place.city` (brief 12).

## Acceptance criteria

- One Drizzle schema expresses the full place-centric model (places, events→places, sources, staged events, geocode cache, users/sessions, favorites, notifications) with no leftover event-centric `resource` table.
- `shared/` exports the updated `Place`/`Event` Zod schemas; ui + backend typecheck against them.
- `db:migrate` from an empty DB yields the complete schema; briefs 03/04/05 need no further structural migrations (only data/logic).
- `architecture.md` data-layer section updated to the consolidated model.
