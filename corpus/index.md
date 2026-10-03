# Corpus Index

The front door for **public-resource-map** project knowledge. Read this first.

> **New here?** Read [wiki/overview.md](wiki/overview.md) → [wiki/glossary.md](wiki/glossary.md) → [wiki/decisions.md](wiki/decisions.md). The project is a **place-centric** map of Romanian public resources + events (POC). Terms like *place*, *OSM*, *Overpass*, *staged event* are defined in the glossary.

## Start here (by task)

| I want to… | Go to |
|---|---|
| Understand what this project is | [wiki/overview.md](wiki/overview.md) + [wiki/glossary.md](wiki/glossary.md) |
| Know what's decided (don't relitigate) | [wiki/decisions.md](wiki/decisions.md) |
| Build the next thing | [Briefs](#briefs) → follow the **recommended build order** |
| Understand the code/architecture | [wiki/architecture.md](wiki/architecture.md) |
| Know what's still open | [wiki/open-questions.md](wiki/open-questions.md) |
| See current state / dev commands | [wiki/status.md](wiki/status.md) |
| Trace history of a decision | [log.md](log.md) |

## Navigation

| File | Contents |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Schema, conventions, workflows for this corpus |
| [log.md](log.md) | Chronological record of every meaningful change |

## Wiki

| Page | What it answers |
|---|---|
| [wiki/overview.md](wiki/overview.md) | What this project is, major components, repo layout |
| [wiki/glossary.md](wiki/glossary.md) | **Project jargon defined** — place, OSM, Overpass, staged event, etc. |
| [wiki/architecture.md](wiki/architecture.md) | Package structure, API routes, UI file map, data layer |
| [wiki/decisions.md](wiki/decisions.md) | Locked tech/design choices — don't relitigate |
| [wiki/status.md](wiki/status.md) | Current state dashboard, per-area snapshot, dev commands |
| [wiki/open-questions.md](wiki/open-questions.md) | Genuinely unresolved: extraction mechanics, matching, spatial index |
| [wiki/design.md](wiki/design.md) | Pointer to the built design system (`ui/DESIGN.md`) + the record of the four directions and why the standard was chosen |
| [../ui/DESIGN.md](../ui/DESIGN.md) | **The design system** — tokens, type scale, elevation, component anatomy, derived from the shipped UI |
| [../ui/PRODUCT.md](../ui/PRODUCT.md) | **Product truth** — users, positioning, constraints, brand commitments, accessibility |
| [wiki/stitch-screens.md](wiki/stitch-screens.md) | Reference HTML screens from Stitch — layout, component classes, patterns for all 4 views |

## Briefs

Briefs 02–06 were split from the original oversized "admin source-ingestion" brief on 2026-06-28; 07–10 were added the same day. **Numbers are stable and ≠ build order** — see the recommended build order below.

| # | File | Status | Title |
|---|---|---|---|
| 01 | [briefs/done/01-stitch-design-brief.md](briefs/done/01-stitch-design-brief.md) | done | Stitch design brief — map UI, components, tokens |
| 02 | [briefs/done/02-auth-and-admin-gate.md](briefs/done/02-auth-and-admin-gate.md) | done | Auth & admin gate (prerequisite for all admin work) |
| 03 | [briefs/done/03-place-model-and-osm-sync.md](briefs/done/03-place-model-and-osm-sync.md) | done | Place model & OSM resource sync (resources-first anchor) |
| 04 | [briefs/todo/04-event-ingestion-pipeline.md](briefs/todo/04-event-ingestion-pipeline.md) | todo | Event ingestion pipeline — refresh/match/geocode/reconcile/diff/accept |
| 05 | [briefs/todo/05-favorites-and-notifications.md](briefs/todo/05-favorites-and-notifications.md) | todo | Favorites & notifications — in-app + email (retention loop) |
| 06 | [briefs/todo/06-place-centric-ui.md](briefs/todo/06-place-centric-ui.md) | todo | Place-centric map UI (refactor of the existing 3-surface UI) |
| 07 | [briefs/done/07-schema-consolidation.md](briefs/done/07-schema-consolidation.md) | done | Schema consolidation & migration plan (**build first**) |
| 08 | [briefs/todo/08-ro-seed-data.md](briefs/todo/08-ro-seed-data.md) | todo | Real RO seed data (Timișoara + București) |
| 09 | [briefs/todo/09-attribution-and-about-data.md](briefs/todo/09-attribution-and-about-data.md) | todo | Attribution & "about the data" transparency |
| 10 | [briefs/todo/10-test-plans-rewrite.md](briefs/todo/10-test-plans-rewrite.md) | todo | Test plans — rewrite place-centric + new-feature coverage (the *what*) |
| 11 | [briefs/done/11-test-infrastructure-tdd-e2e.md](briefs/done/11-test-infrastructure-tdd-e2e.md) | done | Vitest harness (unit + integration) & TDD workflow (the *machinery*; **build early**) |
| 12 | [briefs/todo/12-platform-optimization.md](briefs/todo/12-platform-optimization.md) | todo | Platform optimization — DB PRAGMAs, spatial index, map/Leaflet, SPA (apply incrementally) |
| 13 | [briefs/todo/13-ui-interactions-and-features.md](briefs/todo/13-ui-interactions-and-features.md) | todo | Public UI/UX interactions — place panel, filters, what's-on, city picker, states/a11y |
| 14 | [briefs/todo/14-archived-events-page.md](briefs/todo/14-archived-events-page.md) | todo | Archived events page — past events (citywide + my saved), link to place |
| 15 | [briefs/done/15-draw-to-filter.md](briefs/done/15-draw-to-filter.md) | done | Draw-to-filter — free-hand/polygon spatial map filter (split from 13) |
| 16 | [briefs/todo/16-admin-shell-and-review-ui.md](briefs/todo/16-admin-shell-and-review-ui.md) | todo | Admin shell & ingestion review UI — /admin, sources panel, review table (split from 13) |
| 17 | [briefs/todo/17-playwright-e2e-harness.md](briefs/todo/17-playwright-e2e-harness.md) | todo | Playwright e2e harness — config, fixtures, seeded-DB determinism (split from 11) |
| 18 | [briefs/done/18-guard-anonymous-write-routes.md](briefs/done/18-guard-anonymous-write-routes.md) | done | Guard the anonymous POST/DELETE routes on places and events (audit) |
| 19 | [briefs/done/19-show-in-progress-events.md](briefs/done/19-show-in-progress-events.md) | done | Show in-progress events — window overlap, not "starts after now" (audit) |
| 20 | [briefs/done/20-map-loads-every-place.md](briefs/done/20-map-loads-every-place.md) | done | The map loads every place in the city — no silent 1000 cap (audit) |
| 21 | [briefs/done/21-ward-jwks-failure-is-unavailable.md](briefs/done/21-ward-jwks-failure-is-unavailable.md) | done | Ward: a JWKS fetch failure means "unavailable", never "signed out" (audit) |
| 22 | [briefs/done/22-fresh-clone-setup-path.md](briefs/done/22-fresh-clone-setup-path.md) | done | A fresh clone boots — `.env.example`, env loading, README (audit) |
| 23 | [briefs/done/23-drizzle-snapshot-for-0001.md](briefs/done/23-drizzle-snapshot-for-0001.md) | done | Drizzle snapshot for `0001_ward_cutover` so `generate` is safe (audit) |
| 24 | [briefs/done/24-cross-city-deep-link.md](briefs/done/24-cross-city-deep-link.md) | done | A shared place link adopts the place's city (audit) |
| 25 | [briefs/done/25-osm-healthcare-taxonomy.md](briefs/done/25-osm-healthcare-taxonomy.md) | done | OSM sync: stop importing pharmacies/dentists as "clinic" (audit) |
| 26 | [briefs/done/26-ward-client-test-suite.md](briefs/done/26-ward-client-test-suite.md) | done | A test suite for prm's real Ward client (audit) |
| 27 | [briefs/done/27-remove-ward-cutover-leftovers.md](briefs/done/27-remove-ward-cutover-leftovers.md) | done | Remove Ward-cutover leftovers — dead UI/shared code, `argon2`, `@fastify/cookie` (audit) |
| 28 | [briefs/done/28-spa-template-leftovers-and-pins.md](briefs/done/28-spa-template-leftovers-and-pins.md) | done | SPA-template leftovers out, dependency pins back to policy (audit) |
| 29 | [briefs/todo/29-reconcile-0001-with-schema.md](briefs/todo/29-reconcile-0001-with-schema.md) | todo | Reconcile the deployed schema with `schema.ts` — 0001 drift (**before 05**) |

**Recommended build order:** 07 (schema) → **11 (Vitest harness)** → 02 (auth) → 03 (places/OSM) → 08 (seed) → 04 (ingestion) → **16 (admin review UI)** → 05 (favorites/notifications) → 06 (place-centric UI) → **13 (public interactions)** → **15 (draw-filter)** → **14 (archive)** → **17 (e2e harness)** → 09 (attribution) → 10 (test plans) → deployment (decision locked; brief TBD).
_Notes: 15 (draw) builds on 13's shared filter state. 16 (admin UI) follows 04 (its API) and can be built independently of the public-UI track. 17 (e2e) lands after the UI surfaces exist + the seed (08); 11's Vitest comes early for test-first backend work. 12 is cross-cutting (DB PRAGMAs with 07; rest opportunistic)._

**Audit briefs 18–28 (2026-09-27, [audit](todos/2026-09-27-improvements-audit.md)) — do these before resuming 04:** 18 → 19 → 20 (share route files) · 21 → 26 (share the Ward test file) · 22 → 27 → 28 (share manifests/lockfile) · 23 before any schema edit · 24 and 25 independent. 18, 21, 22, 23 are the cheap urgent ones.

## Test Plans

| File | Contents |
|---|---|
| [test-plans/index.md](test-plans/index.md) | Plan catalog + how a run works |
| [test-plans/RESULTS.md](test-plans/RESULTS.md) | Latest run results (2026-06-26) |

## Todos

| File | Topic |
|---|---|
| [todos/2026-06-26-map-chip-overflow.md](todos/2026-06-26-map-chip-overflow.md) | Map filter chips clipped on mobile (F-01) |
| [todos/2026-06-26-resource-title-tag.md](todos/2026-06-26-resource-title-tag.md) | Resource detail page title is static |
| [todos/2026-06-28-competitor-research-findings.md](todos/2026-06-28-competitor-research-findings.md) | Competitor/source landscape research + ideas |
| [todos/2026-06-28-optimization-research.md](todos/2026-06-28-optimization-research.md) | Platform-optimization + corpus-UX research (feeds brief 12) |
| [todos/2026-06-28-corpus-ux-improvements.md](todos/2026-06-28-corpus-ux-improvements.md) | Corpus-UX improvements (done + proposed) |
| [todos/2026-06-29-pin-map-aesthetic-research.md](todos/2026-06-29-pin-map-aesthetic-research.md) | Pin/map UX + design.md aesthetic research (feeds design.md revision) |
| [todos/2026-09-27-improvements-audit.md](todos/2026-09-27-improvements-audit.md) | Whole-repo improvements audit — ranked findings (→ briefs 18–28), watch list, drops |
