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
| [wiki/design.md](wiki/design.md) | Stitch CivicMap design system — colors, typography, components spec |
| [wiki/stitch-screens.md](wiki/stitch-screens.md) | Reference HTML screens from Stitch — layout, component classes, patterns for all 4 views |

## Briefs

Briefs 02–06 were split from the original oversized "admin source-ingestion" brief on 2026-06-28; 07–10 were added the same day. **Numbers are stable and ≠ build order** — see the recommended build order below.

| # | File | Status | Title |
|---|---|---|---|
| 01 | [briefs/done/01-stitch-design-brief.md](briefs/done/01-stitch-design-brief.md) | done | Stitch design brief — map UI, components, tokens |
| 02 | [briefs/todo/02-auth-and-admin-gate.md](briefs/todo/02-auth-and-admin-gate.md) | todo | Auth & admin gate (prerequisite for all admin work) |
| 03 | [briefs/todo/03-place-model-and-osm-sync.md](briefs/todo/03-place-model-and-osm-sync.md) | todo | Place model & OSM resource sync (resources-first anchor) |
| 04 | [briefs/todo/04-event-ingestion-pipeline.md](briefs/todo/04-event-ingestion-pipeline.md) | todo | Event ingestion pipeline — refresh/match/geocode/reconcile/diff/accept |
| 05 | [briefs/todo/05-favorites-and-notifications.md](briefs/todo/05-favorites-and-notifications.md) | todo | Favorites & notifications — in-app + email (retention loop) |
| 06 | [briefs/todo/06-place-centric-ui.md](briefs/todo/06-place-centric-ui.md) | todo | Place-centric map UI (refactor of the existing 3-surface UI) |
| 07 | [briefs/todo/07-schema-consolidation.md](briefs/todo/07-schema-consolidation.md) | todo | Schema consolidation & migration plan (**build first**) |
| 08 | [briefs/todo/08-ro-seed-data.md](briefs/todo/08-ro-seed-data.md) | todo | Real RO seed data (Timișoara + București) |
| 09 | [briefs/todo/09-attribution-and-about-data.md](briefs/todo/09-attribution-and-about-data.md) | todo | Attribution & "about the data" transparency |
| 10 | [briefs/todo/10-test-plans-rewrite.md](briefs/todo/10-test-plans-rewrite.md) | todo | Test plans — rewrite place-centric + new-feature coverage (the *what*) |
| 11 | [briefs/todo/11-test-infrastructure-tdd-e2e.md](briefs/todo/11-test-infrastructure-tdd-e2e.md) | todo | Test infrastructure & TDD/e2e harness (the *machinery*; **build early**) |
| 12 | [briefs/todo/12-platform-optimization.md](briefs/todo/12-platform-optimization.md) | todo | Platform optimization — DB PRAGMAs, spatial index, map/Leaflet, SPA (apply incrementally) |
| 13 | [briefs/todo/13-ui-interactions-and-features.md](briefs/todo/13-ui-interactions-and-features.md) | todo | UI/UX interactions & features — place panel, filters, **draw-to-filter**, **/admin shell**, states/a11y |

**Recommended build order:** 07 (schema) → **11 (test harness)** → 02 (auth) → 03 (places/OSM) → 08 (seed) → 04 (ingestion) → 05 (favorites/notifications) → 06 (place-centric UI) → **13 (UI interactions/features)** → 09 (attribution) → 10 (test plans) → deployment (decision locked; brief TBD). _Brief 12 is cross-cutting: its DB PRAGMAs apply with brief 07; the rest apply opportunistically. Brief 13 builds on 06's shell (06 = structure, 13 = interaction detail + draw-filter + /admin)._ _11 lands right after the schema so features 02–06 can be built test-first; 10 (plans) follows the UI._

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
