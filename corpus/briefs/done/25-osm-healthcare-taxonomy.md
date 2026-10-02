# Brief 25 — OSM sync: stop importing pharmacies and dentists as "clinic"

> Written 2026-09-27 from the [improvements audit](../../todos/2026-09-27-improvements-audit.md) (#8). Independent. **Carries a product decision**, taken below with a default; overrule it before building if you disagree.

## Context

`CATEGORY_RULES` (`backend/src/lib/osm-categories.ts`) has a bare-key rule, `{ key: "healthcare", category: "clinic" }`. `OVERPASS_TAG_FILTERS` is derived from the same list, so the Overpass query asks for **every** element carrying any `healthcare=*` tag, and all of them become "clinic". In OSM that tag covers pharmacies, dentists, laboratories, opticians and alternative medicine: mostly private businesses.

**Measured 2026-09-27** (one Overpass count, București bbox, named elements only, the app's own filters): of **3,171** places the sync would import, **1,016** carry a `healthcare` value other than clinic/hospital/doctor/centre, and **699** are `amenity=pharmacy`. About a third of the city's map would be pharmacies and private practices labelled "clinic", on a product whose unit is a *public* resource ([overview.md](../../wiki/overview.md)). The locked mapping calls for buckets "covering common civic/cultural POIs" ([decisions.md → Ingestion & data mechanics](../../wiki/decisions.md)).

It also feeds brief 20's volume problem: those rows would crowd the fetch.

## Decision taken here (default — overrule before building)

A pharmacy or dentist is **not** a public resource for this map. Narrow the bare key to `healthcare=hospital|clinic|centre`. Keep the existing `amenity=clinic|hospital|doctors` rule as it is. `amenity=doctors` was listed on purpose; revisiting it is a separate call.

## Files you OWN
- `backend/src/lib/osm-categories.ts`
- `backend/src/lib/osm-categories.test.ts`

## Files you must NOT touch
- `backend/src/lib/osm-sync.ts`: the query builder already derives from the rules.
- `shared/src/types/place.ts`: no new category.

## What to do
1. Replace `{ key: "healthcare", category: "clinic" }` with `{ key: "healthcare", values: ["hospital", "clinic", "centre"], category: "clinic" }`, keeping its position in the priority order.
2. Measure the other bare-key rule, `{ key: "sport", category: "sports" }`, with **one** Overpass `out count` query per city. Count how many named `sport=*` elements are commercial gyms (`leisure=fitness_centre`) or shops. Report the numbers in the log; do not change the rule in this brief.
3. Tests: `OVERPASS_TAG_FILTERS` contains no bare `["healthcare"]` filter. A pharmacy (`amenity=pharmacy` + `healthcare=pharmacy`) and a dentist (`healthcare=dentist`) map to `other` if they ever arrive. `healthcare=hospital` → `clinic`. The existing priority test still passes.
4. **Already-synced databases keep their pharmacies**: the sync never retires rows (an audit watch item). If any environment has synced already, note in the log the one-off SQL that removes `source='osm'` rows now out of scope and unreferenced, and run it only with the user's go-ahead.

## Acceptance
- Unit tests above pass; `npm test`, `npm run typecheck` green.
- The log entry records before/after counts for București from a count query (before: 3,171 total / 1,016 non-clinic healthcare).

## Outcome (2026-10-03)

Done with the default decision. București 3,177 → 2,178 named places and Timișoara 719 → 521, from one Overpass count each. The `sport` measurement (București 286 named, 26 gyms, 10 shops; Timișoara 53, 3, 0) is in the log, and the rule is unchanged. `osm-sync.test.ts` needed its example filter line updated, which is outside the brief's file list but a one-line expectation. No reachable environment has synced, so the retire-SQL for deployed ones is written in the log and not run.
