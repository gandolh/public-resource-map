# Corpus Index

The front door for **public-resource-map** project knowledge. Read this first.

## Navigation

| File | Contents |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Schema, conventions, workflows for this corpus |
| [log.md](log.md) | Chronological record of every meaningful change |

## Wiki

| Page | What it answers |
|---|---|
| [wiki/overview.md](wiki/overview.md) | What this project is, major components, repo layout |
| [wiki/architecture.md](wiki/architecture.md) | Package structure, API routes, UI file map, data layer |
| [wiki/decisions.md](wiki/decisions.md) | Locked tech/design choices — don't relitigate |
| [wiki/status.md](wiki/status.md) | Current state dashboard, per-area snapshot, dev commands |
| [wiki/open-questions.md](wiki/open-questions.md) | Genuinely unresolved: map library, data sources, auth, deployment |
| [wiki/design.md](wiki/design.md) | Stitch CivicMap design system — colors, typography, components spec |
| [wiki/stitch-screens.md](wiki/stitch-screens.md) | Reference HTML screens from Stitch — layout, component classes, patterns for all 4 views |

## Briefs

Briefs 02–06 were split from the original oversized "admin source-ingestion" brief on 2026-06-28; they are listed in **dependency / build order**.

| # | File | Status | Title |
|---|---|---|---|
| 01 | [briefs/done/01-stitch-design-brief.md](briefs/done/01-stitch-design-brief.md) | done | Stitch design brief — map UI, components, tokens |
| 02 | [briefs/todo/02-auth-and-admin-gate.md](briefs/todo/02-auth-and-admin-gate.md) | todo | Auth & admin gate (prerequisite for all admin work) |
| 03 | [briefs/todo/03-place-model-and-osm-sync.md](briefs/todo/03-place-model-and-osm-sync.md) | todo | Place model & OSM resource sync (resources-first anchor) |
| 04 | [briefs/todo/04-event-ingestion-pipeline.md](briefs/todo/04-event-ingestion-pipeline.md) | todo | Event ingestion pipeline — refresh/match/geocode/reconcile/diff/accept |
| 05 | [briefs/todo/05-favorites-and-notifications.md](briefs/todo/05-favorites-and-notifications.md) | todo | Favorites & in-app notifications (retention loop) |
| 06 | [briefs/todo/06-place-centric-ui.md](briefs/todo/06-place-centric-ui.md) | todo | Place-centric map UI (refactor of the existing 3-surface UI) |

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
