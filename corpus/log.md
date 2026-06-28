# Log

## [2026-06-28] research + brief + corpus-UX | Optimization research, brief 12, glossary + index front door

Online research into making the corpus smoother + optimizing the platform (sources in `todos/2026-06-28-optimization-research.md`).

**Platform → brief 12 (platform optimization):** evidence-based, apply-incrementally optimizations. DB: WAL + synchronous=NORMAL + foreign_keys + busy_timeout PRAGMAs at startup (apply with schema brief 07); prepared statements. Spatial: `(lat,lng)`+`city` indexes, server-side bbox+city filtering, R-tree as a noted future option. Map: viewport-only markers, Leaflet.markercluster + chunkedLoading, canvas renderer, clearLayers/addLayers — all gated on *measured* slowdown (real data, brief 08). SPA: debounced bbox refetch, route-lazy admin UI. Explicit "do NOT pre-optimize" section. WAL caveat (same-host) noted — aligns with single-VPS deployment.

**Corpus UX (applied now):** added `wiki/glossary.md` (defines place/OSM/Overpass/staged-event/etc. — jargon-dense domain); upgraded `index.md` with a "New here?" path + task-oriented "Start here" table. Captured the larger rollout (front-matter metadata — research cited 89% discoverability gain; per-page source-of-truth lines; decision IDs) as `todos/2026-06-28-corpus-ux-improvements.md`. Rejected Docusaurus (LLM is the consumer, not a docs-site audience). Also flagged `status.md` as stale (predates the reframe) — refreshed separately.

## [2026-06-28] brief | Brief 11 — test infrastructure & TDD/e2e harness

Filed brief 11 — the testing *machinery*, distinct from brief 10 (test *plans*). Found that despite the locked testing decision, **no test infra exists**: no runner, no config, no specs, no test scripts; "Playwright" had been manual screenshot-driving only. Brief 11 stands up the pyramid: **Vitest** (unit + auth internals + Fastify `.inject()` API integration, co-located `*.test.ts`) and **@playwright/test** (assertion-based e2e in a new `e2e/` dir, seeded throwaway RO DB, T/B geolocation mock, test-only reminder-sweep trigger). Root scripts `test`/`test:watch`/`test:cov`/`test:e2e`/`test:all`. Deps reasoned to house style: Vitest (Vite/ESM fit, no Jest), no supertest (use Fastify `.inject()`), component-test deps deferred. **No GitHub Actions / hosted CI** (user choice) — `npm run test:all` is the local pre-commit gate. The manual `playwright/` hub is kept for brief 10's visual audit; automated e2e is separate. Build order updated: 11 lands right after schema (07) so features 02–06 can be built test-first.

## [2026-06-28] brief | Four foundational briefs added (07–10) + build order

Corpus + online exploration surfaced gaps the feature briefs (02–06) didn't own. Added:
- **07 — Schema consolidation** (build FIRST): reconcile the NYC `resource`/`event` schema with the place-centric model; one coherent migration instead of 03/04/05 each bolting on colliding tables. Clean reset acceptable (POC, no prod data).
- **08 — Real RO seed data**: deterministic `db:seed` from a captured OSM sync (frozen fixture) + hand-curated real T/B events + a demo user with favorites/notifications. Replaces NYC; first real-data milestone.
- **09 — Attribution & "about the data"**: ODbL requires `© OpenStreetMap contributors` (+ CARTO) map-corner attribution (confirmed from OSM Foundation guidelines); per-event source credit; an about-data page with the link-out posture + iaBilet POC disclaimer + takedown contact. Compliance, not polish.
- **10 — Test plans rewrite**: TP-01–04 test the old event-centric UI; rewrite for place-centric + add TP-05 auth / TP-06 favorites+notifications (reminder idempotency) / TP-07 admin ingestion. Switch geo mock NYC→T/B.

Numbers are stable ≠ build order. Recommended order recorded in `index.md`: 07→02→03→08→04→05→06→09→10→deploy. Deployment execution brief deferred (decision locked; write when its time comes). `index.md` briefs table updated.

## [2026-06-28] research + decision | Competitor/source landscape scan → three decisions (two reversals)

Scanned comparable platforms + probed the real RO event-source landscape (full findings: `todos/2026-06-28-competitor-research-findings.md`). Key learnings: Bandsintown is our retention-loop mirror (wins via push+email); Localist confirms API-first/scrape-last is industry-standard; **but** probing showed RO sources are almost all static HTML (data.gov.ro cultural calendar is a dead static XLSX; museums/OneEvent expose no feeds), and the comprehensive layer (ZileșiNopți/OneEvent) are reuse-restricted competitors. Net: no RO source is clean + machine-readable + comprehensive — pick 2 of 3.

Three decisions (recorded in `wiki/decisions.md`; briefs 04/05 updated):
- **Event sourcing = clean + sparse.** Scrape only defensible primary publishers (municipal/publicly-funded calendars + venues/museums); accept sparse coverage; **OSM resources carry the map**. Do NOT scrape commercial aggregators.
- **[REVERSAL] Adapter scope: "build all" → build a few (2–4) clean adapters well.** Confirmed every adapter is fragile bespoke HTML scraping; "all sources" is post-POC expansion.
- **[REVERSAL] Notifications: "in-app-only" → in-app inbox + email.** Email reuses auth email infra and buys the away-from-app retention ping (the loop's whole point per Bandsintown). Web/native push stays the #1 post-POC upgrade.

## [2026-06-28] brief | Split brief 02 into 02–06 (dependency-ordered)

The rewritten brief 02 had grown to span auth, the place model, OSM sync, the event pipeline, favorites/notifications, and admin UI — three+ buildable units under one number. Split into five focused briefs in build order:
- **02 — Auth & admin gate** (rescoped from the old 02 file; prerequisite for all admin work).
- **03 — Place model & OSM resource sync** (resources-first anchor; events attach to places).
- **04 — Event ingestion pipeline** (refresh/match/geocode/reconcile/diff/accept; depends on 02+03).
- **05 — Favorites & in-app notifications** (retention loop; depends on 02/03/04).
- **06 — Place-centric map UI** (refactor of the existing 3-surface UI; depends on 03/04/05).

Admin-UI concerns from the monolith are folded into each owning brief (sources panel + diff/review in 04; OSM sync action in 03) rather than a separate brief. `index.md` briefs table updated. Old `02-admin-source-ingestion.md` removed (its content is distributed across 02–06; rationale preserved here + in `decisions.md`).

## [2026-06-28] decision | Major reframe — POC, place-centric, public-source ingestion (grilling session)

A deep grilling session re-shaped the product across eight branches. All locked in `wiki/decisions.md`; `overview.md`, `open-questions.md`, and `brief 02` rewritten to match.

- **Legal (the trigger):** read iaBilet's ToS (`/terms/ro/`). **Art. 28.3 forbids extracting/reproducing/publicly communicating their content in any form, wholly or partially**; 28.1 vests all IP in them. The "link-out aggregator" defense does **not** cure a ToS breach, and text-only cards don't either. → Project **reframed as a proof-of-concept**; iaBilet adapter is POC-only, **permission is a hard launch blocker**.
- **Product shape:** pivoted **events-first → place-centric, resources-first**. Map unit is a **place**; events attach to places. Two place sources: **OSM** (ODbL, clean anchor) and **event-venue** (created when an event's venue can't match an OSM place). Ambiguous venue↔event matches go to the admin, not auto-merged.
- **Event sourcing:** from **public primary publishers** (venue/museum/municipal calendars), never scraped aggregators. **API-first, scrape-last** discovery (iCal/RSS/JSON-LD/sitemap before HTML). Scope: **Timișoara + București**, build **all** per-city adapters (chosen with cost in view). Images dropped — **text-only cards, category by color.**
- **Robustness:** refreshes **reconcile** (stale/changed, not append-only); per-source **health flags** (`suspect` on 0/big-drop); **soft-break quarantine** via Zod sanity checks.
- **Auth:** full end-user auth **kept**, re-justified as a demoed POC retention feature.
- **Notifications: in-app inbox only** (no email/push). Two favorite entities (`favorite_place`, `favorite_event`). Trigger #1: inbox on **admin-accept** for place-favoriters. Trigger #2: **in-process daily reminder sweep** in the Fastify API — fixed local time, next-calendar-day in **Europe/Bucharest**, idempotent via unique `(userId,eventId,kind)`.
- **Geocoding:** **fallback only** (OSM-match first), Nominatim public (1 req/s, UA, cache), **manual-pin** for failures (never drop), self-host noted as future.
- **Map UI:** map is home; **pin = place** (category color + event badge); **unified place panel** (`/resources/:id` collapses in); standalone `/events` reframed as a citywide **"what's on"** index linking back to places; **city picker** added as primary nav.
- **Deploy:** pm2 runs **one** Fastify process (reminder sweep in-process); **no separate cron**. **OSM sync bypasses the accept gate** (trusted/licensed), admin-triggered + infrequent, upserts `source:osm` only.

Next action: the existing code + brief 02 now need to catch up to these decisions (the code still reflects the old event-centric NYC-seed model).

## [2026-06-28] decision | Product direction locked — real RO events product, auth/testing/deploy chosen

Grilling session resolved eight branching decisions, now recorded in `wiki/decisions.md`:
- **Direction:** real product (not portfolio/learning).
- **Market + data:** Romania, events-first; iabilet.ro anchor + OSM resources secondary; NYC seed to be replaced.
- **Ingestion:** investigate iabilet (affiliate? internal JSON? ToS? venue geocoding?) *before* building — tracked in `wiki/open-questions.md`.
- **Location:** city picker primary (persisted), GPS optional.
- **Auth:** full email+password now, self-hosted, argon2id, httpOnly+Secure+SameSite session cookie in SQLite, verify/reset flows built now with console-logged links in dev.
- **Testing:** e2e-first Playwright (assertion-based, seeded DB) + thin Vitest suite for auth internals.
- **Deployment:** single VPS via bootstrap-vps-deploy — Caddy (auto-HTTPS) + pm2 (Fastify + ingestion cron) + host volume for `app.db`.

Recommended build order: investigate iabilet → city picker + real RO data → e2e harness → auth → deploy.

Also fixed stale `wiki/architecture.md`: all four routes (`/`, `/map`, `/events`, `/resources/:id`) are wired (it claimed `/events` wasn't a route), and refreshed the UI file map to reflect the real tree (map/, hooks/, stores/, TanStack Query, Zustand). Next action: investigate iabilet.ro ingestion.

## [2026-06-28] decision + brief | Admin-curated multi-source ingestion (supersedes cron)

Changed the ingestion model from an autonomous cron to an **admin-curated refresh pipeline**, and broadened from iabilet-only to **multiple Romanian sources**.
- Researched RO event platforms. Probed for machine-readable data: **iaBilet.ro** = JSON-LD (best); **bilete.ro/entertix.ro/myticket.ro** (one PLG group) declare **sitemaps with `lastmod`**; **Eventim.ro** bot-protected (defer); **livetickets.ro** thin/JS (defer). Source table in `wiki/open-questions.md`.
- New model (locked in `wiki/decisions.md` → "Event ingestion model"): admin manages a **source list**, hits **per-source / refresh-all** buttons, pipeline does fetch→parse→geocode→**dedup**→**diff of what's new**, admin **accepts/bulk-accepts** (and reject/ignore); only accepted events go live. Ingestion sits behind the **admin gate** (auth moved earlier in build order as a prerequisite).
- Filed **brief 02** (`briefs/todo/02-admin-source-ingestion.md`): data model (`event_source`, `staged_event`, `geocode_cache`), admin-gated API, admin UI, dedup (within + cross-source), and open mechanics to resolve at build.

## [2026-06-28] investigation | iabilet.ro ingestion mechanism

Investigated how to get iabilet.ro events into the DB. Findings (full detail in `wiki/open-questions.md`):
- No public API / affiliate feed; iabilet's "partner" offerings are seller-side (white-label ticket sales, ads).
- robots.txt permits event listing/detail pages (disallows only auth/account/cart/googleMap/short-links). No sitemap.
- **Best path: parse embedded schema.org JSON-LD** — every listing page has ~10 Event blocks, detail pages have one; fields map ~1:1 to our `Event` schema (name, url, dates, image, location address, price/currency). Must fetch raw HTML (WebFetch strips the ld+json).
- **Geocoding required** — JSON-LD has street address only, no lat/lng.
- Pagination + city filtering are client-side JS (`Paginated.js`); page-2/per-city extraction still to resolve at implementation time (Playwright or the AJAX endpoint).
- Design: cron (pm2) → fetch → parse JSON-LD → geocode (cached) → upsert with dedup on canonical url/id.

## [2026-06-26] done | UI audit run — 1 bug fixed, 2 findings filed

Ran TP-01 through TP-04 against seeded data. Fixed raw JSON rendering in resource
detail Hours section (`HoursDisplay` component in `resources.$id.tsx`). Filed F-01
(map chip overflow on mobile) and a minor title-tag observation as corpus todos.
Full results in `test-plans/RESULTS.md`.

## [2026-06-26] done | Seed script added; 8 resources + 8 events loaded (NYC)

Added `backend/src/db/seed.ts` and `db:seed` npm script. Seeded 8 resources and
8 events around New York City (Central Park area). Migration confirmed clean.

## [2026-06-26] done | Stitch screens integrated into corpus; stitch_output removed

Extracted structural patterns from all 4 Stitch HTML screens into `wiki/stitch-screens.md`. Moved brief 01 to `briefs/done/`. Deleted `stitch_output/` directory and `stitch_civic_mapper.zip` from repo root. Updated `index.md` accordingly.

## [2026-06-26] todo | Brief 01 — Stitch design brief filed

Filed `briefs/todo/01-stitch-design-brief.md` — a full design brief for Stitch (or any design tool) covering the map home screen, detail drawer, events list, map pins, and color/token system. Covers implemented vs. to-do scope and design constraints (responsive, dark mode, WCAG AA, Tailwind/Radix stack).

## [2026-06-26] done | Brief 01 — CivicMap design implementation shipped

Implemented the full Stitch CivicMap design system. Key deliverables:
- Replaced shadcn/ui with `@base-ui/react` (Button, Avatar, Menu, Toggle, Slider, Input)
- Added `react-leaflet` + CartoDB Positron/DarkMatter tiles
- CSS custom property token system + `@theme inline` Tailwind v4 bridge
- Component library: CategoryBadge, FilterChip, EventCard, MapPin, DetailDrawer, SearchInput, Pagination, RadiusSlider
- Rebuilt Navbar with CivicMap branding and lucide icons
- Wired all 3 routes: `/map` (Leaflet + filter overlay), `/events` (grid + filter chips), `/resources/:id` (detail page)
- Home (`/`) redirects to `/map`
- Fixed `Layout.tsx` default export (was causing navbar to not render)
- Fixed `ResourceMarkers.tsx` — removed `react-dom/server` import breaking SPA mode
- Typecheck passes clean; all routes render correctly verified with Playwright

## [2026-06-26] maintenance | Bootstrap monorepo + corpus

Restructured project as npm workspaces (`shared`, `backend`, `ui`). Updated all packages to latest stable (React 19.2.7, React Router 8.0.1, Vite 7.3.6, Fastify 5.8.5, Tailwind 4.3.1, TypeScript 5.8.5, Drizzle 0.45.2). Created Fastify + SQLite backend with Drizzle ORM and Zod validation; generated initial migration. All three packages compile and type-check cleanly. Seeded corpus wiki (overview, architecture, decisions, status, open-questions).
