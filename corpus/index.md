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

Generated from each page's `summary:` frontmatter by `bash corpus/lint.sh --index`; do not edit
between the markers. Read the summary first and open at most two or three pages (see
[CLAUDE.md](CLAUDE.md)).

<!-- BEGIN CATALOG -->

- [wiki/architecture.md](wiki/architecture.md) — How the code is put together: the ui → shared ← backend workspaces, the UI file map, backend routes and services, and what lives in shared.
- [wiki/decisions-engineering.md](wiki/decisions-engineering.md) — Locked stack (npm workspaces, React Router 8, pinned versions…) and code conventions — check before changing tooling or style.
- [wiki/decisions-identity.md](wiki/decisions-identity.md) — Identity decisions: prm's own accounts with "Sign in with Ward" as a linked second way in (2026-10-13), and the superseded designs before it (prm-only auth, then Ward-only identity).
- [wiki/decisions-ui.md](wiki/decisions-ui.md) — Visual direction and interface decisions: the 2026-09-04 design system that replaced CivicMap Material, interface language, the basemap constraint, and (2026-11-11) the theme switch and the Base UI conventions, and (2026-11-12) the map state in the URL.
- [wiki/decisions.md](wiki/decisions.md) — Locked product, legal, ingestion, data, map/UI, testing and deployment choices, plus the owner's dated answers since 2026-10-04 — check before relitigating anything; identity, UI and stack live in split-out pages.
- [wiki/design.md](wiki/design.md) — A pointer to the built design system (ui/DESIGN.md) and product truth (ui/PRODUCT.md), with the record of the four directions considered and why the standard one won.
- [wiki/glossary.md](wiki/glossary.md) — Project vocabulary, one definition per term — place, OSM, Overpass, staged event, reconcile and the rest; read it before using a domain word.
- [wiki/open-questions.md](wiki/open-questions.md) — Two open items from the source registry (2026-11-12) — the basemap tiles' terms were never read, and per-layer modules wait for a second layer; the 2026-11-04 drops and the iaBilet rule stay settled.
- [wiki/overview.md](wiki/overview.md) — What prm is (a place-centric map of public resources and their events in Timișoara and București, a proof of concept), its major components, external dependencies and repo layout.
- [wiki/status.md](wiki/status.md) — The current-state dashboard as of 2026-11-02, what is built and verified, the gap between code and decisions, a per-area snapshot with dates, and the dev commands.

<!-- END CATALOG -->

Outside the wiki, but read alongside it:

| Page | What it answers |
|---|---|
| [../ui/DESIGN.md](../ui/DESIGN.md) | **The design system** — tokens, type scale, elevation, component anatomy, derived from the shipped UI |
| [../ui/PRODUCT.md](../ui/PRODUCT.md) | **Product truth** — users, positioning, constraints, brand commitments, accessibility |
| [wiki/history/stitch-screens.md](wiki/history/stitch-screens.md) | HISTORICAL — the 2026-06-26 Stitch reference screens for the retired CivicMap design |

## Briefs

Specs are in [briefs/](briefs/) and run in number order; numbering restarted at 01 on 2026-11-02,
and the thirty-five before that are folded into the wiki (see [log.md](log.md), "Briefs reset").
Where things stand is in [wiki/status.md](wiki/status.md).

## Test Plans

| File | Contents |
|---|---|
| [test-plans/index.md](test-plans/index.md) | Plan catalog + how a run works |
| [test-plans/RESULTS.md](test-plans/RESULTS.md) | Latest run results (2026-06-26) |

## Todos

| File | Topic |
|---|---|
| [wiki/history/2026-06-28-competitor-research-findings.md](wiki/history/2026-06-28-competitor-research-findings.md) | Competitor/source landscape research + ideas |
| [wiki/history/2026-06-28-optimization-research.md](wiki/history/2026-06-28-optimization-research.md) | Platform-optimization + corpus-UX research (feeds brief 12) |
| [wiki/history/2026-06-29-pin-map-aesthetic-research.md](wiki/history/2026-06-29-pin-map-aesthetic-research.md) | Pin/map UX + design.md aesthetic research (feeds design.md revision) |
| [wiki/history/2026-10-04-source-shortlist.md](wiki/history/2026-10-04-source-shortlist.md) | Event-feed probe of public venues in both cities (retired 2026-10-07) |
| [wiki/history/2026-09-27-improvements-audit.md](wiki/history/2026-09-27-improvements-audit.md) | Whole-repo improvements audit — ranked findings (→ briefs 18–28), watch list (→ 30, 33, 34), drops (retired 2026-10-07) |
