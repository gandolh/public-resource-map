# Decisions

Locked tech and design choices. Don't relitigate without an explicit revisit + log entry.

## Product direction (locked 2026-06-28, revised 2026-06-28 after ToS check)

- **This is a proof-of-concept**, not a launch-ready business. The tech is demonstrable end-to-end; **commercial/public launch of the iaBilet integration is BLOCKED on obtaining permission** (see Legal posture below). Prioritize real data, deployment, and a usable core loop over polish.
- **Target market: Romania, PLACE-centric (revised twice).** The map's unit is a **place**, not an event. Pins are places; selecting a place shows **what's on there**. Two place sources:
  - **OSM-sourced places** — public resources (parks, libraries, clinics, museums, town halls) via Overpass (ODbL, reuse permitted with attribution). The clean, always-present anchor.
  - **event-derived places** — created on demand when an event's venue can't be matched to an existing OSM pin; geocode its address to a point, mark `source: event-venue`. So an **event always gets a place**, even if that place isn't in OSM.
- **Events come from public/legal primary sources, NOT from scraping aggregators.** Source events from the publishers themselves: venue/museum calendars (temporary exhibitions), municipal / town-hall public-event listings, public cultural-institution feeds. A **buy-tickets link is shown only if that public source itself provides one** — never manufactured by scraping iaBilet. _This is the legal fix: sourcing from primary publishers who want to be found, not from a ToS-protected aggregator DB._
- **Venue↔event join:** match an event's venue string to an existing OSM place; **ambiguous matches are NOT auto-merged** — they surface in the admin diff/accept step for a human to resolve (consistent with the admin-curated model).
- **Core loop:** open app → pick my city → see nearby places on the map → select a place → see what's on there → (if the source provides it) click through to buy. The product no longer depends on any legally-blocked source.
- **Geographic scope (locked): Timișoara + București only** for now; architecture must stay extendable to more cities (city is config, not hardcoded).
- **Adapter scope (revised 2026-06-28 after source research — was "build all"): build a FEW (2–4) high-value, legally-defensible adapters well.** Research confirmed every RO source is bespoke **HTML scraping** (the API/iCal/RSS/JSON-LD rungs are mostly empty — see [research todo](../todos/2026-06-28-competitor-research-findings.md)), so "build all" meant many fragile parsers for a POC. Reversed: build a small clean set; **"all sources" is post-POC expansion**. Per-source terms vetted individually as each adapter is added.
- **Event coverage is intentionally SPARSE for the POC; OSM resources carry the map.** Because no RO event source is simultaneously clean + machine-readable + comprehensive (you get 2 of 3), the POC takes **clean + sparse**: scrape only defensible **primary publishers** — municipal / publicly-funded calendars (Centrul de Proiecte Timișoara, timisoara-info.ro) + individual venues/museums. **Do NOT scrape the commercial aggregators** (ZileșiNopți / OneEvent) — that recreates the iaBilet ToS problem one level up. This is why resources-first is essential, not cosmetic: the map must stand on OSM since events are thin.
- **Location model: city picker is primary** — user selects/defaults to a Romanian city (persisted to localStorage via `locationStore`), with a sensible default radius. Native GPS is an *optional* "center on me" enhancement, never a dependency. This sidesteps the "works without geolocation" problem and matches how users think ("what's on in Cluj this weekend").
- **Recommended build order:** (1) ~~investigate iabilet ingestion~~ **done 2026-06-28** — sources probed, JSON-LD path confirmed; (2) city picker + replace seed with real RO data; (3) auth + admin gate (prerequisite for the admin ingestion UI); (4) admin source-ingestion pipeline (brief 02 — refresh/diff/accept/dedup); (5) e2e harness on seeded data; (6) VPS deploy. Note: auth moved earlier than originally planned because the admin ingestion UI sits behind the admin gate.

## Legal posture (locked 2026-06-28 — ToS checked)

- **iaBilet.ro ToS forbids reuse.** Art. 28.1: all IP in site content belongs to them; Art. 28.3: "Este interzisă preluarea, reproducerea, distribuirea și/sau comunicarea publică în orice formă a Conținutului ... integral sau parțial" — taking/reproducing/publicly communicating any content, in any form, wholly or partially, is **prohibited**. Source: https://www.iabilet.ro/terms/ro/
- **The "link-out aggregator" defense does NOT cure this.** It addresses copyright-infringement framing but not the explicit ToS extraction ban. Text-only cards (title/venue/date) don't help either — that's still "preluarea ... parțial." Deep-linking is not carved out in their ToS.
- **Images: text-only cards, no artwork** (locked separately). Categories conveyed via **color coding**, not images. This removes the copyright-on-artwork + bandwidth-theft risk, independent of the ToS issue.
- **Decision: build the iaBilet adapter as POC only.** Obtaining explicit permission (or an official partner/feed) is a **hard blocker before any business/public launch** of that integration. Logged, not hand-waved.
- **OSM/Overpass is the one clean source** (ODbL — reuse permitted with attribution), which is why the product anchor pivoted to resources-first.

## Source discovery — API-first, scrape-last (locked 2026-06-28)

- **Prefer a machine-readable contract over scraping. Always probe before writing a parser.** Per-source discovery order, strict:
  1. **Official API** (REST/GraphQL) — best, most stable.
  2. **Structured feed** — **iCal/`.ics`** (common for municipal & cultural calendars — often unadvertised; check!), RSS/Atom, JSON-LD, clean event sitemap.
  3. **HTML scraping** — last resort, only when 1 and 2 don't exist.
- Rationale: every API/feed found is one fewer fragile bespoke HTML parser to build, monitor, and repair. Reduces the cost of the "all per-city adapters" scope without reducing coverage.
- Each `event_source` records which mechanism it uses (`adapterKey` + mechanism), so fragility is visible at a glance.

## Ingestion robustness (locked 2026-06-28)

- **Refreshes reconcile, they don't just append.** A previously-accepted event that vanishes from its source on a later refresh → marked `stale`/`ended` (soft, with a grace window — sources flicker). A **changed** event (date/price moved) re-enters the diff as `changed` for re-confirmation. No silently-wrong "live" events with no retraction path.
- **Per-source health is first-class.** Store `lastStatus`, `lastEventCount`, `lastSuccessfulAt`. A refresh returning **0 or a large drop** vs. last run → flagged `suspect`, surfaced loudly in admin UI, never silent (catches hard breaks from source redesigns).
- **Soft-break defense.** Each adapter's output passes **sanity validation** (reuse `shared/` Zod schemas: title non-empty, date parses to a plausible future-ish date, venue present). Malformed rows go to a **"needs attention" bucket**, not the clean diff — so a mis-parsing adapter pollutes a quarantine, not the live DB.

## OSM resource ingestion (locked 2026-06-28)

- **OSM BYPASSES the diff/accept gate** — direct upsert, no human review. Rationale: the event review gate exists to guard *untrusted, scraped, possibly-illegal, dedup-risky* data; **OSM is trusted, clean, ODbL-licensed, and carries coordinates** — none of those risks apply. Forcing it through accept/reject would be ceremony with no payoff. **Events keep the full diff/accept pipeline; OSM does not.**
- **Admin-triggered + infrequent.** A **"sync OSM for this city" button** (reuses the admin gate + manual-trigger muscle), run on demand / ~monthly — NOT on the frequent event cadence (libraries don't move; OSM changes slowly). This also serves as the **first load** for Timișoara/București.
- **Upserts ONLY `source: osm` places.** An OSM re-sync must **never clobber** `source: event-venue` places or admin **manual-pin** corrections — it touches OSM-sourced rows only.
- Ingest-once-into-SQLite, serve-from-DB (Overpass is not for live user queries — rate-limited, batch-oriented). See [open-questions.md](open-questions.md) for query shape / category mapping (still to define).

## Ingestion & data mechanics (locked 2026-06-28 — grilling pass)

- **Venue↔place matching:** normalize the venue string (lowercase, strip diacritics/punctuation, strip room-noise like "Sala Mare", collapse whitespace) → **fuzzy token-set/trigram score** against OSM place names+aliases **in the same city** → two thresholds: **high = auto-match**, **mid = ambiguous (admin picks from top candidates)**, **low = no match → geocode a new event-venue place**. Thresholds start conservative (favor "ambiguous" over a wrong auto-match) and are tuned from real data.
- **"Changed" detection (re-refresh of an accepted event) is tiered:**
  - **Re-review** (back into the admin diff as `changed`): **startDate/time, venue, cancellation** — anything affecting *whether/where* a user shows up.
  - **Silent update** (apply, no re-review): **price, description, buyUrl, image**.
  - **Ignore:** whitespace/formatting-only.
- **Geocode sanity (before a result becomes a live pin):** accept only if the point is **inside the active city's bounding box** AND the **result granularity is specific** (reject country/city/administrative centroids; want road/building/POI) AND Nominatim **importance/confidence clears a floor**. Any failure → **admin manual-pin queue**, never silently live.
- **`geocode_cache` key = conservative normalized address + city:** lowercase, strip diacritics, expand/strip RO abbreviations (str./strada, nr., bd./bulevardul, p-ța/piața), collapse whitespace/punctuation, append city. Biased toward correctness — a near-miss just re-geocodes (cheap), never collapses two real addresses into one coord.
- **OSM tag → `PlaceCategory`:** an explicit **priority-ordered, first-match-wins rule list** (deterministic for multi-tagged features), ~8–12 buckets covering common civic/cultural POIs; mapped-but-unlisted → **"other" (visible, not dropped)**. The Overpass tag filter and this map are kept in sync. **One primary category per pin** (no multi-category).
- **Event horizon / recency:** the **map, what's-on, and reminders** show **upcoming events only** (now → optional ~90-day cap). When an event's end passes it flips to **past/archived status** (excluded from those surfaces) but is **retained** — for dedup + reconcile history AND as the data behind the **archived-events page** ([brief 14](../briefs/todo/14-archived-events-page.md)): a public `/archive` (citywide past events + a logged-in "my past favorites" tab), each linking to its still-existing place. A periodic prune removes very old archived rows (the archive shows what's retained, not literally forever). _Applies consistently across ingestion, what's-on, reminders, the archive page, and DB-growth control._

## Geocoding (locked 2026-06-28)

- **Geocode only as a FALLBACK.** Try the venue↔OSM-place match first — a matched OSM place already has coordinates from the OSM ingest (free, no API call). **Geocode only the venues that don't match.** The matcher is thus also a geocoding-cost reducer; every successful match is a geocode not performed.
- **Provider: public Nominatim** (`nominatim.openstreetmap.org`) for the POC, used **strictly within policy**: max **1 req/s** enforced in code, a **real identifying User-Agent**, **no bulk** — geocoding runs *inside the admin refresh* (human-triggered, never on user traffic).
- **`geocode_cache` keyed by normalized address** (brief 02 already has this): a venue is geocoded **at most once, ever**. Turns a cold-cache burst into incremental-over-time and keeps within policy.
- **Un-geocodable / wrong-looking venues are FLAGGED, never dropped.** The admin diff/accept UI gets a **manual-pin tool** — the admin drops a pin on the map by hand; the event still lands, the human supplies the point. (RO event addresses are often street-number-less / "Sala Mare, Casa de Cultură" — a meaningful fraction won't geocode cleanly. Expected, handled by manual pinning.)
- **Self-hosted Nominatim** on the VPS is the noted **future upgrade** (no rate limit, own data) if volume justifies it — explicitly NOT POC scope.

## Event ingestion model (locked 2026-06-28 — supersedes earlier cron idea)

- **Admin-curated refresh, NOT an autonomous cron.** A human admin triggers ingestion and reviews results before anything goes live. Rationale: keeps a human in the loop for data quality, legal posture, and dedup correctness; avoids a brittle unattended job silently publishing bad/duplicate events.
- **Multiple sources, managed as a list in the admin UI.** Each source is a configured adapter (iaBilet, bilete.ro, …). A **per-source refresh button** and a **"refresh all"** button.
- **Refresh = fetch → parse → geocode → diff against DB.** Output is a **diff/preview of what's new** (and ideally changed), not an immediate write.
- **Review + accept workflow.** Admin sees the new events and **accepts individually or bulk-accepts**; only accepted events are persisted as live. (Optionally: reject/ignore so they don't resurface.)
- **Deduplication is mandatory** at refresh time — within a source (canonical `url`/source id) and across sources (same event listed on multiple platforms): match on normalized title + date + venue/city. Dedup runs *before* the diff is shown so the admin isn't asked to accept duplicates.
- **Per-adapter extraction** is source-specific. Mechanics tracked in [open-questions.md](open-questions.md); full spec in [briefs/todo/04-event-ingestion-pipeline.md](../briefs/todo/04-event-ingestion-pipeline.md).
- Ingestion endpoints live behind the **admin gate** (the same auth; admin-only role/flag). Geocoding is shared infra (cached venue → coords).

## Map / UI model (locked 2026-06-28 — supersedes the original event-centric UI)

The current 3-surface UI (`/map` resource markers · standalone `/events` grid · `/resources/:id`) was built for the old event-centric model and is now partly wrong. New model — **place-centric, map is home:**

- **Pin = place**, colored by **category** (color-per-category, already decided), with a **small badge/dot when the place has upcoming events** (a plain marker can't express "library with 3 events"). The current `ResourceMarkers` component must change to encode category-color + event-presence.
- **Selecting a pin opens a place panel** showing the place's identity (what it is, address, hours) **+ its event list** (each event: date, title, **buy-link only if the source provided one**). This **merges** the old resource-detail + event-list concepts into one surface.
- **`/resources/:id` collapses into a unified PLACE surface.** One model whether reached by pin-click (panel) or deep link (full page) — do not maintain two divergent place views.
- **Standalone list view survives but is reframed:** no longer the event-centric `/events`, but a citywide **"what's on" index** — all upcoming events across the current city's places, each **linking back to its place on the map**. A secondary date-first lens on the same data, not a separate data model.
- **City picker is a primary Navbar control** (NEW), scoped to **Timișoara / București**, **defaulting to Timișoara** (or nearest of the two if geolocation is granted), persisted via `locationStore`. "Center on me" is a separate optional button; the app works fully with geolocation denied.

## UI interactions & features (locked 2026-06-28 — full grilling pass; detail in [brief 13](../briefs/todo/13-ui-interactions-and-features.md))

- **Place panel:** identity + events **grouped by date** (Today / This weekend / Later), first ~5 then expand, empty state. Event row = title/time/EventCategory dot/buy-link-if-present.
- **Selection:** pin click **pans + zoom-to-fits** so the pin clears the panel/sheet, scales 32→40px, deep-links to `/places/:id`.
- **Filtering is multi-axis, all AND-ed + shared with the what's-on list:** PlaceCategory chips + an **event-timing lens** ("today"/"this weekend") + **draw-to-filter**. The timing lens **HARD-filters (removes) non-matching places, not dims** (revised 2026-06-28 stress-test — dimming is invisible at pin density; show a banner + count + clear).
- **Pin clustering is a day-one legibility requirement** (revised 2026-06-28 stress-test — moved out of brief 12's "defer until perf"): cluster at city zoom; per-pin category color + event badge resolve only when zoomed past overlap.
- **Stress-test edge cases (locked 2026-06-28; full detail in [brief 13](../briefs/todo/13-ui-interactions-and-features.md)):** draw = explicit mode toggle (locks pan); drawn shape persists across pan/zoom/panel/what's-on, cleared on city change; zero-results = guided recovery overlay (removable filter chips + widen hint), never a blank map; favorite-while-logged-out = contextual login prompt then complete the favorite; `/places/:id` = full page+mini-map when cold/shared, panel-over-map in-app, draggable mobile sheet; mobile = collapsing chrome (filters/draw behind one button) to keep the map the hero; new-event notifications coalesced per (place, accept-batch) to avoid bell floods.
- **Draw-to-filter (NEW):** free-hand + polygon over the map; **client-side point-in-polygon** over loaded city places (Turf or small helper); ephemeral, one shape, clearable, live result count; ANDs with other filters. Leaflet draw plugin (Geoman/Leaflet.draw). Saved per-user areas deferred.
- **What's-on list** honors the same active filters (incl. drawn area), links each event back to its place.
- **Auth screens:** dedicated centered-card routes (`/login` `/register` `/verify` `/reset`), not over the map.
- **/admin (NEW — own contextual menu):** separate layout + **sidebar nav** (Sources, Review queue, Places, later Users) + exit-to-public; route-lazy-loaded, admin-gated. **Review screen** = dense filterable table (source→status) + sticky bulk accept/reject toolbar + row→detail drawer with map preview + ambiguous-match resolver.
- **Notifications:** Navbar **bell + unread badge + dropdown** (items link to place/event) + mark-all-read + full view.
- **States & a11y on every surface:** loading (skeleton) / empty (copy+action) / error (retry); WCAG AA — keyboard map+panel nav, focus management, ARIA, 4.5:1 category contrast, category never color-only.

## Data conventions (locked 2026-06-28)

- **Dates: UTC ISO 8601 strings** in the DB; convert to **Europe/Bucharest only at compute/display** (reminder sweep, today/weekend grouping). Centralized TZ logic.
- **PKs: `randomUUID()` everywhere + unique natural-key constraints** for dedup (place osmType+osmId, geocode_cache address, favorites, notifications).
- **No universal soft-delete:** lifecycle via **status enums**; hard-delete only transient rows.
- **Two category enums:** `PlaceCategory` + `EventCategory` (separate taxonomies, color-coded per-enum).
- **Dependency policy:** minimal, **exact-pinned**, justified per add in its brief; prefer a tiny helper over a heavy lib, but don't hand-roll mature solved problems (drawing). New this session: `vitest`, `@vitest/coverage-v8`, `@playwright/test` (brief 11), `argon2` (brief 02), a Leaflet draw plugin + point-in-polygon (brief 13).

## Auth (locked 2026-06-28)

- **Full end-user auth is in scope now** (not deferred), because favorites + notifications are the **retention loop the POC is meant to demonstrate** — not just admin gating. (Re-confirmed 2026-06-28 against the POC reframe: kept deliberately, as a demoed feature.)
- **Email + password, self-hosted** — matches the house style of hand-rolling over dependencies (better-sqlite3, no UUID lib, Zod). No managed provider (Clerk/Auth0) for v1.
- **Hashing: argon2id** (or bcrypt) — never plaintext/SHA.
- **Sessions: opaque session id in an httpOnly + Secure + SameSite cookie**, stored server-side in SQLite. **Not** a JWT in localStorage (XSS-stealable). Use `@fastify/cookie`.
- **Verify + reset flows are built now**, but email delivery is **console-logged links in dev**; swap in a transactional email provider (Resend/Postmark/SES) before launch.
- The Navbar profile dropdown is currently **decorative**; it becomes real when auth lands.

## Favorites & notifications (locked 2026-06-28)

- **Two favorite entities:**
  - `favorite_place` (userId → placeId) — drives "new here" notifications.
  - `favorite_event` (userId → eventId) — drives day-before reminders. _Distinct from favoriting a place; "remind me before this" only makes sense for a specific event the user intends to attend._
- **Notifications: IN-APP inbox + EMAIL (revised 2026-06-28 after research — was in-app-only).** The in-app inbox/bell stays (testable, natural read-model); **email is added as a second delivery channel on the same notification rows**, reusing the auth verify/reset email infra (console-logged in dev, provider before launch). Rationale: Bandsintown/Apple Music confirm the **away-from-app ping** is the core of the retention loop the POC exists to demo; in-app-only was the weakest part of the story and email is cheap given the infra already exists.
- **Web/native push is still OUT** for the POC — the noted #1 post-POC retention upgrade (service worker + VAPID, iOS caveats).
- Email sends are best-effort/idempotent off the same `notification` rows (don't double-send on retries).
- **Two triggers create inbox items:**
  1. **New-events trigger** — fires **synchronously at the admin-accept step**: when an admin accepts new events at a place, create inbox items for users who `favorite_place`d it. (Not at scrape time — unaccepted events don't notify.)
  2. **Day-before reminder** — a **once-a-day scheduled sweep running IN-PROCESS inside the Fastify API service** (not a separate pm2 process, not OS cron; distinct from the rejected *ingestion* cron — this one only reads accepted events + writes inbox rows, nothing legally/data sensitive). Semantics: **daily sweep at a fixed local time (e.g. 09:00 Europe/Bucharest)** selects `favorite_event`s whose start is the **next calendar day in Bucharest time**, inserts reminder inbox rows. **Idempotent** via a unique constraint on `(userId, eventId, kind='reminder')` so restarts/double-runs never duplicate. Timezone comparison is **Europe/Bucharest**, not UTC (events are ISO 8601 strings).

## Testing (locked 2026-06-28)

- **E2e-first via Playwright**, but **assertion-based** against a **seeded deterministic DB** (`db:seed`) — not screenshot-eyeballing. Mock geolocation/network for repeatable runs.
- **Plus a thin Vitest suite for auth internals only** — password hashing, single-use reset tokens, session expiry — because these breach-risk behaviors are invisible from the browser and e2e structurally cannot cover them.
- Component tests and broader unit coverage are deferred, not chasing coverage numbers.

## Deployment (locked 2026-06-28)

- **Single VPS** via the `bootstrap-vps-deploy` pattern: **Caddy** (automatic HTTPS — required for geolocation + Secure cookies) serving the static SPA, **pm2** running **one process: the Fastify backend** (which serves the REST API *and* runs the in-process daily reminder sweep), and a **host volume for `app.db`** (SQLite in a container without a persistent volume loses the DB on redeploy).
- **No separate cron process** (corrects the earlier plan): ingestion is admin-triggered (no cron); the only scheduled job — the day-before reminder — runs **in-process inside the Fastify API** (see Favorites & notifications). The previously-planned "separate ingestion cron pm2 process" no longer exists — don't provision it.
- Not serverless/PaaS for v1 — SQLite persistence + cron + a real filesystem fit a VPS far better.

## Stack

- **npm workspaces** (not pnpm/yarn) — `workspace:*` protocol not supported; use `"*"` for local package refs.
- **React Router 8** (not v7) — latest stable as of 2026-06-26; requires Vite 7+.
- **Vite 7** (not Vite 8 beta) — stable build tool for React Router 8.
- **Tailwind CSS 4** — Vite plugin approach (`@tailwindcss/vite`), not PostCSS.
- **Fastify 5** (not Express) — chosen for performance and TypeScript-first plugin system.
- **better-sqlite3** (not `node:sqlite` or `libsql`) — synchronous, battle-tested, native addon; fits single-server deployment.
- **Drizzle ORM** (not Prisma) — lightweight, SQL-close, no separate runtime process.
- **Zod** for validation — schemas live in `shared/` and TS types are derived via `z.infer`; backend imports them so shape + validation have one source of truth.
- **TanStack Query** for all UI→backend reads — replaces hand-rolled `useEffect`+fetch; provider in `Layout.tsx`, client in `ui/app/lib/queryClient.ts`.
- **Zustand** for UI state — `locationStore` (geolocation requested once, shared across pages) and `mapFilterStore` (category/radius/search/selection).
- **SPA mode** for the UI (`ssr: false` in `react-router.config.ts`) — simplifies deployment; no server-side rendering needed for an interactive map app. Note: route modules must use `clientLoader`, not `loader` (a `loader` export fails the build in SPA mode).
- **SQLite** (not Postgres) — appropriate for single-server / local-first deployments at this scale.
- **Exact pinned dependency versions** (no `^` ranges) in every `package.json` — reproducible installs.

## Known/accepted issues

- **`npm audit`: 4 moderate (esbuild GHSA-67mh-4wv8-2f99).** Sole source is `drizzle-kit`'s transitive `@esbuild-kit/core-utils → esbuild@~0.18.20`. Accepted, not fixed: (1) dev-tooling only — `drizzle-kit` never ships to production and isn't used by any npm script (migrations run via `drizzle-orm`'s migrator through `tsx`; drizzle-kit is only for manual `generate`); (2) the advisory requires running esbuild's dev server, which `drizzle-kit generate` does not; (3) `0.31.10` is the latest stable and still pins the vulnerable esbuild — only `1.0.0-beta`/`rc` drop it; (4) an `esbuild` override won't apply because `@esbuild-kit/core-utils` uses the incompatible 0.18 platform-package layout. `npm audit fix --force` would *downgrade* drizzle-kit to 0.18.1 — do not run it.

## Code conventions

- **Import extensions are package-specific** (corrected 2026-06-28 — the old "no `.js` suffixes anywhere" was wrong and would break the backend at runtime):
  - **`backend/` + `shared/`** run as **Node ESM** (`"type": "module"`, executed via `tsx`/`node dist`), so relative imports **MUST keep the `.js` suffix** (the existing code already does). Per research, code that runs directly in Node wants `moduleResolution: "nodenext"`, which *requires* the extension; the current `"bundler"` setting tolerates the suffix but is philosophically for bundled code — consider switching backend/shared to `nodenext` during brief 07. **Do not strip `.js` from backend/shared imports.**
  - **`ui/`** is bundled by **Vite**, so imports are **extensionless** (current state). 
- **OKLCH color tokens** in CSS custom properties — future-proof color space, already in place via `app.css`.
- **`cn()` utility** (`clsx` + `tailwind-merge`) as the canonical class-building function.
- **UI primitives: `@base-ui/react`** (Button, Avatar, Menu, Toggle, Slider, Input) + lucide-react icons. _(History: the original Stitch brief said shadcn/ui new-york; it was replaced by `@base-ui/react` during brief 01 implementation — see log 2026-06-26.)_

## Data model

- **Bounding-box proximity** for spatial queries (not Haversine, not PostGIS) — acceptable approximation for city-scale; revisit if performance degrades at scale.
- **ISO 8601 strings** for all dates in the DB (SQLite has no native date type).
- **`randomUUID()`** (Node built-in) for IDs — no external UUID library.
