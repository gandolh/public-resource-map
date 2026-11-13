---
summary: The current-state dashboard as of 2026-11-13, what is built and verified, the gap between code and decisions, a per-area snapshot with dates, and the dev commands.
updated: 2026-11-13
---

# Status

_Last updated: 2026-11-13_

**2026-11-13:** brief 06, [the redesign "The docked desk"](../briefs/done/06-a-redesign-with-hallmark-on-the-estate-board.md), is built and awaits a deploy (`deploy`): new tokens, a docked band, the place column on the left, a content-sized phone sheet over a tab bar, and every screen restyled. See [decisions-ui.md](decisions-ui.md).

**2026-11-12 (later):** brief 01, [a source registry and map links that can be shared](../briefs/done/01-a-source-registry-and-shareable-map-links.md), is built and awaits a deploy (`all`, after brief 05's). `shared/src/sources.ts` lists every source with its licence and reuse status, `DATA_SOURCES.md` is generated from it, the public API holds back a `forbidden` source's rows and credits the rest, and the map's state is in its URL. See [decisions.md](decisions.md) (the Legal posture revisit) and [open-questions.md](open-questions.md) (the tiles' terms).

**2026-11-12:** brief 05, [the server in the code structure](../briefs/done/05-the-server-in-the-code-structure.md), is built and awaits a deploy (`all`). The API reads its settings from `config.ts`, runs from `server.ts`, splits by feature, and declares a zod schema on every route, a response included, on zod 4.6.7. `check-structure` is strict. See [decisions-engineering.md](decisions-engineering.md).

**2026-11-11 (later):** brief 04, [Base UI by the conventions](../briefs/done/04-base-ui-by-the-conventions.md), is built and awaits a deploy: the stylesheet is in layers, every Base UI part sits behind a wrapper, the place sheet is a Drawer, and the Light / Dark / System switch keys off `data-theme` and starts light. See [decisions-ui.md](decisions-ui.md).

**2026-11-11:** brief 03, [the house style and the quality harness](../briefs/done/03-the-house-style-harness.md), is built and awaits a deploy: `npm run check` passes, the code is formatted at width 120, and ESLint, knip and dependency-cruiser run. See [decisions-engineering.md](decisions-engineering.md).

**2026-11-10:** brief 02 (Base UI 1.9.0) was built and awaits a deploy; see [log.md](../log.md).

**2026-11-09:** brief 01 was filed; it waited on the owner's grilling of 2026-11-10.

## 🟢 The UI is now the new model

The public surface has been rebuilt place-centric on a replacement design system (2026-09-04). **Done + verified: the schema, the Vitest harness, auth and the admin gate, places and OSM sync, the place-centric UI and public interactions, the RO seed, the test plans.** The map is home, the pin is a place, events live inside a place, and a citywide what's-on index shares one filter model with the map.

**Deployed 2026-10-07**, Ward first. The first deploy missed migration 0004 (vps-deploy ran migrations from a stale `prm-migrate` image), so `/api/places` answered 500 until a `server` redeploy with vps-deploy's fix. Adding the two Timișoara feeds is dropped from the open steps (owner, 2026-10-07): they stay approved and can be added from the admin at any time. No brief is open; brief numbering restarted at 01 on 2026-11-02 (see [log.md](../log.md)).

**The live site has no places yet.** On 2026-10-09 the production site answers at `/prm/`, but its API returns 0 places for both cities. Loading them, e.g. the per-city OSM sync in `/prm/admin`, is the owner's call.

## Where things stand

**The old design system is gone, and so is the event-centric UI.** The 2026-06-29 "Warmer Editorial-Civic" world (Fraunces + steel-blue Material tokens) was retired without ever being built; the user asked for a total UI/UX rework, chose the category convention played straight at a Citymapper/Linear craft bar, and that is now locked ([decisions-ui.md → Visual direction](decisions-ui.md)).

What actually exists to look at: a full-bleed map of Timișoara or București with clustered category pins that badge their upcoming-event count, a place panel (desktop) / bottom sheet (mobile, a Drawer) showing what is on at that place grouped Today / Tomorrow / This weekend / Later, a citywide what's-on index, category chips + a timing lens that hard-filters, Romanian by default with an English switch, and both themes (light first, a switch in the top bar).

**The honest gap: there is still no real event source.** The ingestion pipeline (04) exists, but every event in the app is seeded and synthetic (labelled as such in `backend/src/db/seed-data.ts`). The places are real: the seed loads a frozen OSM sync of both cities (2,449 places inside the two municipal boundaries, captured 2026-10-04). Vetting the first sources is what makes this a product rather than a demo.

## Code vs. decisions gap

Mostly closed on the public surface. Already migrated:
- ~~Schema: standalone `resource`/`event`~~ → **consolidated place-centric Drizzle schema.**
- ~~No test runner~~ → **Vitest harness (unit + Fastify `.inject()`), 104 passing (2026-10-03).**
- ~~UI: `/map`, `/events`, `/resources/:id`~~ → **`/` (map is home), `/places/:id` nested under it, `/whats-on`; old URLs redirect.**
- ~~NYC seed~~ → **Timișoara + București seed: a frozen OSM sync clipped to the city limits (2,449 places) + one event venue, 15 synthetic events, stable ids (the RO seed data).**
- ~~No place-events or citywide endpoint~~ → **`upcomingEventCount` on `/api/places`, `/api/places/:id/events`, `/api/whats-on`.**
- ~~No favorites, no notification bell~~ → **favourites, the bell and notification email (2026-10-03, 2026-10-07).**
- ~~No `/verify` or `/reset` UI routes~~ → **not prm's: verification and reset are Ward's (2026-09-06).**

Still open:
- **No real event source yet** — the event ingestion pipeline exists; the sources are an owner decision.
- **CARTO now requires an API key** — the app falls back to filtered OSM tiles until `VITE_CARTO_API_KEY` is set (see [decisions.md → Basemap constraint](decisions.md)).

## Per-area snapshot

| Area | State |
|---|---|
| npm workspaces | done — shared/backend/ui wired |
| shared types | **done (new shape) — `Place`/`Event`, two category enums (the schema consolidation)** |
| backend API | done — `/api/places`, `/api/events`, `/api/whats-on`, `/api/archive`, favourites + inbox, and the admin routes ([architecture.md → API routes](architecture.md)) |
| UI routes | **done (new model) — `/` map home, `/places/:id` panel-over-map, `/whats-on`, `/archive`, `/about-data`, `/admin`; legacy URLs redirect; sign-in is Ward's** |
| Component library | **rebuilt — new token layer (`ui/app/app.css`), Button/Chip/Segmented/SearchInput/Skeleton/StateBlock/CategoryBadge, map pins + clusters, place panel/sheet, filter bar** |
| Dark mode | **done — both themes designed, not inverted; light/dark/system** |
| Schema consolidation | **done — consolidated place-centric Drizzle schema; 9 tables since the Ward cutover dropped the four user tables (migrations 0000–0004)** |
| Vitest harness | **done — Vitest 4 (unit + Fastify `.inject()` integration), `test`/`test:watch`/`test:cov`, `it.todo` seams** |
| Auth | **superseded by Ward (2026-09-06)** — identity, sign-in and grants are Ward's; prm keeps `requireAuth`/`requireAdmin` over Ward grants. The first auth's argon2/cookie/AuthCard leftovers were removed by the cutover clean-up |
| Audit sweep | **done (2026-09-27 → 2026-10-03)** — admin-only writes, running events stay visible, the map pages through every place, JWKS failure = 503, 0001 snapshot, cross-city deep links, public-healthcare-only OSM sync, real Ward client tests, cutover leftovers gone, template leftovers gone and every manifest exact-pinned, and (2026-10-03) `notification_event` keyed on its pair, with a drift check comparing migrated vs `schema.ts` |
| Owner Q&A follow-ups | **all done 2026-10-07:** Ward is asked only by the guards and `/api/me`; iCal descriptions lose WordPress shortcodes and keep their ticket link; http(s)-only links, calendar-day "tomorrow", a 100 s Overpass timeout and one sync per city, an introspection cache that sweeps expired entries; a re-sync retires places OSM dropped (`retired_at`, migration 0004), with a 10% safety valve; notification email through Ward |
| Docs site | **done 2026-10-19, not deployed** — the Docusaurus move: Docusaurus 3.10 at the same `/prm/docs/` URLs (plus `/search/`), both themes with the toggle; vps-deploy flipped its asset check on 2026-10-19, so it can deploy |
| Places + OSM sync | **done — admin `POST /api/admin/osm/sync` (Overpass, tag→PlaceCategory map, centroid, non-clobbering upsert), public `GET /api/places`(+`:id`), ODbL attribution on map.** Since 2026-10-07 a re-sync also retires places OSM dropped (OSM retirement; deployed databases need `db:migrate` for 0004) |
| RO seed data | **done 2026-10-04** — `db:seed` resets to a frozen OSM fixture of both cities (`npm run db:capture-osm` refreshes it) + an event venue + 15 synthetic events, all under stable v5 ids the e2e suite addresses (`SEED`); `SEED_DEMO_SUBJECT` gives a Ward subject favourites and a bell item. Real curated events dropped: they would be stale in days, and real events come through 04 |
| Event ingestion | **done 2026-10-03 (pipeline)** — iCal adapter, match/geocode/dedup/reconcile/health, staged diff + admin API, 45 tests. **First sources decided 2026-10-06:** Filarmonica Banatul and Teatrul Național Timișoara, approved; adding them is the owner's whenever they want, not an open step (the iCal shortcode fix is done: shortcodes stripped, TNTM's eventim button becomes the buy link). **București stays places-only for now** (owner, 2026-10-07) |
| Favorites + notifications | **done 2026-10-03 (in-app)** — star/remind-me, signed-out → Ward → favourite completed, coalesced new-event items at accept, 09:00 Bucharest reminder sweep, bell. **Email since 2026-10-07** (notification email): Ward mails each inbox row on prm's behalf; prm still holds no addresses. Ward's footer is English (decided 2026-10-28) |
| Place-centric UI | **done** — the last pieces (star, bell) shipped with 05 on 2026-10-03 |
| Attribution | **done 2026-10-03** — `© OpenStreetMap contributors` + CARTO, `/about-data`, per-event source credit; **since 2026-11-12 all from the source registry** (`shared/src/sources.ts`, `DATA_SOURCES.md`). **Owed: `VITE_DATA_CONTACT`** (the takedown address) before launch; the page's "events are samples" callout goes when 04 lands |
| Test plans | **done 2026-10-04** — TP-01…07 rewritten place-centric + sign-in/favourites/ingestion, each case mapped to its test or marked manual; walked against the local Ward ([RESULTS](../test-plans/RESULTS.md)): six bugs fixed (unnamed pins, Enter on a pin, login return, category guesser…), TP-05 fails on Ward's sign-out |
| Platform optimization | **closed 2026-10-03** — WAL + NORMAL + FKs + 5 s busy wait, tested; indexes verified; bbox-fetch superseded by whole-city loading (20/15); canvas/batching wait for a measured slowdown |
| Public UI interactions | **done 2026-10-03** — plus removable filter chips + widen hint on zero results, a lens banner, selection dimming, the phone's folded attribution. Two sheet snaps kept (owner's call); favorites/bell are 05's |
| Archived events page | **done 2026-10-03** — /archive: citywide + mine (saved events and followed places), month-grouped, category chips, paged; "past" computed beside the live window. No prune yet |
| Draw-to-filter | **done 2026-10-03** — freehand + polygon, hand-rolled on Leaflet (Geoman's freehand is Pro-only); map + what's-on, cleared on city change |
| Admin shell & review UI | **done 2026-10-03** — /admin (own shell, code-split, gated): confidence-ordered review queue with bulk accept/reject and a drawer (map, candidates, manual pin); sources with health, refresh, add-source, OSM sync. Browser-walked against local Ward |
| Playwright e2e harness | **done 2026-10-03** — `npm run test:e2e`: own ports, fresh seeded DB per run, 9 public-surface specs (found a draw-mode pin bug); signed-in specs run against a fake Ward since 2026-10-04 (26 specs) |
| i18n | **done — RO default + EN switch, `Intl.PluralRules`/`DateTimeFormat`, no framework** |
| Deployment | **deployed 2026-10-07** by vps-deploy, Ward first; the live database has no places (2026-10-09) |

## Dev commands

```bash
# from repo root
npm install
cp .env.example .env          # dev loads it into both processes
npm run build -w shared       # must build first
npm run db:migrate -w backend # first time only
npm run db:seed -w backend    # resets to Timișoara + București (OSM fixture + synthetic events)
npm run dev                   # backend (3001) + ui (5173) → http://localhost:5173/prm/
npm run typecheck             # all workspaces
npm test                      # Vitest (backend + shared): unit + Fastify .inject() integration
npm run test:watch            # TDD inner loop
npm run test:cov              # coverage (reported, not gated)
npm run test:e2e              # Playwright: own API + UI on :3101/:5174, fresh seeded DB
```
