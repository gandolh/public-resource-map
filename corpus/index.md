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
- [wiki/decisions-identity.md](wiki/decisions-identity.md) — Identity decisions: the superseded original auth design, and why sign-in, accounts and public registration are Ward's since 2026-09-06.
- [wiki/decisions-ui.md](wiki/decisions-ui.md) — Visual direction and interface decisions: the 2026-09-04 design system that replaced CivicMap Material, interface language, and the basemap constraint.
- [wiki/decisions.md](wiki/decisions.md) — Locked product, legal, ingestion, data, map/UI, testing and deployment choices, plus the owner's 2026-10-04 answers — check before relitigating anything; identity, UI and stack live in split-out pages.
- [wiki/design.md](wiki/design.md) — A pointer to the built design system (ui/DESIGN.md) and product truth (ui/PRODUCT.md), with the record of the four directions considered and why the standard one won.
- [wiki/glossary.md](wiki/glossary.md) — Project vocabulary, one definition per term — place, OSM, Overpass, staged event, reconcile and the rest; read it before using a domain word.
- [wiki/open-questions.md](wiki/open-questions.md) — Only the genuinely unresolved: București event sources, threshold tuning that needs real data, and secondary items.
- [wiki/overview.md](wiki/overview.md) — What prm is (a place-centric map of public resources and their events in Timișoara and București, a proof of concept), its major components, external dependencies and repo layout.
- [wiki/status.md](wiki/status.md) — The current-state dashboard: what is built and verified, the gap between code and decisions, a per-area snapshot, and the dev commands.

<!-- END CATALOG -->

Outside the wiki, but read alongside it:

| Page | What it answers |
|---|---|
| [../ui/DESIGN.md](../ui/DESIGN.md) | **The design system** — tokens, type scale, elevation, component anatomy, derived from the shipped UI |
| [../ui/PRODUCT.md](../ui/PRODUCT.md) | **Product truth** — users, positioning, constraints, brand commitments, accessibility |
| [wiki/history/stitch-screens.md](wiki/history/stitch-screens.md) | HISTORICAL — the 2026-06-26 Stitch reference screens for the retired CivicMap design |

## Briefs

Briefs 02–06 were split from the original oversized "admin source-ingestion" brief on 2026-06-28; 07–10 were added the same day. **Numbers are stable and ≠ build order** — see the recommended build order below.

| # | File | Status | Title |
|---|---|---|---|
| 01 | [briefs/done/01-stitch-design-brief.md](briefs/done/01-stitch-design-brief.md) | done | Stitch design brief — map UI, components, tokens |
| 02 | [briefs/done/02-auth-and-admin-gate.md](briefs/done/02-auth-and-admin-gate.md) | done | Auth & admin gate (prerequisite for all admin work) |
| 03 | [briefs/done/03-place-model-and-osm-sync.md](briefs/done/03-place-model-and-osm-sync.md) | done | Place model & OSM resource sync (resources-first anchor) |
| 04 | [briefs/done/04-event-ingestion-pipeline.md](briefs/done/04-event-ingestion-pipeline.md) | done | Event ingestion pipeline — refresh/match/geocode/reconcile/diff/accept |
| 05 | [briefs/done/05-favorites-and-notifications.md](briefs/done/05-favorites-and-notifications.md) | done | Favorites & notifications — in-app + email (retention loop) |
| 06 | [briefs/done/06-place-centric-ui.md](briefs/done/06-place-centric-ui.md) | done | Place-centric map UI (refactor of the existing 3-surface UI) |
| 07 | [briefs/done/07-schema-consolidation.md](briefs/done/07-schema-consolidation.md) | done | Schema consolidation & migration plan (**build first**) |
| 08 | [briefs/done/08-ro-seed-data.md](briefs/done/08-ro-seed-data.md) | done | Real RO seed data (Timișoara + București) |
| 09 | [briefs/done/09-attribution-and-about-data.md](briefs/done/09-attribution-and-about-data.md) | done | Attribution & "about the data" transparency |
| 10 | [briefs/done/10-test-plans-rewrite.md](briefs/done/10-test-plans-rewrite.md) | done | Test plans — rewrite place-centric + new-feature coverage (the *what*) |
| 11 | [briefs/done/11-test-infrastructure-tdd-e2e.md](briefs/done/11-test-infrastructure-tdd-e2e.md) | done | Vitest harness (unit + integration) & TDD workflow (the *machinery*; **build early**) |
| 12 | [briefs/done/12-platform-optimization.md](briefs/done/12-platform-optimization.md) | done | Platform optimization — DB PRAGMAs, spatial index, map/Leaflet, SPA (apply incrementally) |
| 13 | [briefs/done/13-ui-interactions-and-features.md](briefs/done/13-ui-interactions-and-features.md) | done | Public UI/UX interactions — place panel, filters, what's-on, city picker, states/a11y |
| 14 | [briefs/done/14-archived-events-page.md](briefs/done/14-archived-events-page.md) | done | Archived events page — past events (citywide + my saved), link to place |
| 15 | [briefs/done/15-draw-to-filter.md](briefs/done/15-draw-to-filter.md) | done | Draw-to-filter — free-hand/polygon spatial map filter (split from 13) |
| 16 | [briefs/done/16-admin-shell-and-review-ui.md](briefs/done/16-admin-shell-and-review-ui.md) | done | Admin shell & ingestion review UI — /admin, sources panel, review table (split from 13) |
| 17 | [briefs/done/17-playwright-e2e-harness.md](briefs/done/17-playwright-e2e-harness.md) | done | Playwright e2e harness — config, fixtures, seeded-DB determinism (split from 11) |
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
| 29 | [briefs/done/29-reconcile-0001-with-schema.md](briefs/done/29-reconcile-0001-with-schema.md) | done | Reconcile the deployed schema with `schema.ts` — 0001 drift (**before 05**) |
| 30 | [briefs/todo/30-resolve-ward-only-where-needed.md](briefs/todo/30-resolve-ward-only-where-needed.md) | todo | Ask Ward only on the routes that need a user |
| 31 | [briefs/todo/31-ical-wordpress-shortcodes.md](briefs/todo/31-ical-wordpress-shortcodes.md) | todo | Strip WordPress shortcodes from iCal descriptions; keep their ticket link |
| 32 | [briefs/todo/32-notification-email-through-ward.md](briefs/todo/32-notification-email-through-ward.md) | todo | Send notification email through Ward (waits on wzd_auth brief 17) |
| 33 | [briefs/done/33-watch-list-hardening.md](briefs/done/33-watch-list-hardening.md) | done | Four fixes from the audit's watch list: links, "tomorrow", Overpass, the Ward cache |
| 34 | [briefs/todo/34-osm-retires-deleted-places.md](briefs/todo/34-osm-retires-deleted-places.md) | todo | An OSM re-sync retires places OSM no longer has |

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
| [wiki/history/2026-06-28-competitor-research-findings.md](wiki/history/2026-06-28-competitor-research-findings.md) | Competitor/source landscape research + ideas |
| [wiki/history/2026-06-28-optimization-research.md](wiki/history/2026-06-28-optimization-research.md) | Platform-optimization + corpus-UX research (feeds brief 12) |
| [wiki/history/2026-06-29-pin-map-aesthetic-research.md](wiki/history/2026-06-29-pin-map-aesthetic-research.md) | Pin/map UX + design.md aesthetic research (feeds design.md revision) |
| [todos/2026-09-27-improvements-audit.md](todos/2026-09-27-improvements-audit.md) | Whole-repo improvements audit — ranked findings (→ briefs 18–28), watch list, drops |
