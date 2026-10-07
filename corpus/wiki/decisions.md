---
summary: Locked product, legal, ingestion, data, map/UI, testing and deployment choices, plus the owner's dated answers since 2026-10-04 — check before relitigating anything; identity, UI and stack live in split-out pages.
updated: 2026-10-07
---

# Decisions

Locked tech and design choices. Don't relitigate without an explicit revisit + log entry.

## Split-out pages (2026-10-04)

This page passed ~200 lines, so three groups moved, unchanged:
- [decisions-identity.md](decisions-identity.md): the original auth design and "Identity is Ward's".
- [decisions-ui.md](decisions-ui.md): visual direction, interface language, the basemap constraint, the 2026-06-29 design direction.
- [decisions-engineering.md](decisions-engineering.md): the stack and code conventions.

## Product direction (locked 2026-06-28, revised 2026-06-28 after ToS check)

- **This is a proof-of-concept**, not a launch-ready business. The tech is demonstrable end-to-end; **commercial/public launch of the iaBilet integration is BLOCKED on obtaining permission** (see Legal posture below). Prioritize real data, deployment, and a usable core loop over polish.
- **Target market: Romania, PLACE-centric (revised twice).** The map's unit is a **place**, not an event. Pins are places; selecting a place shows **what's on there**. Two place sources:
  - **OSM-sourced places** — public resources (parks, libraries, clinics, museums, town halls) via Overpass (ODbL, reuse permitted with attribution). The clean, always-present anchor.
  - **event-derived places** — created on demand when an event's venue can't be matched to an existing OSM pin; geocode its address to a point, mark `source: event-venue`. So an **event always gets a place**, even if that place isn't in OSM.
- **Events come from public/legal primary sources, NOT from scraping aggregators.** Source events from the publishers themselves: venue/museum calendars (temporary exhibitions), municipal / town-hall public-event listings, public cultural-institution feeds. A **buy-tickets link is shown only if that public source itself provides one** — never manufactured by scraping iaBilet. _This is the legal fix: sourcing from primary publishers who want to be found, not from a ToS-protected aggregator DB._
- **Venue↔event join:** match an event's venue string to an existing OSM place; **ambiguous matches are NOT auto-merged** — they surface in the admin diff/accept step for a human to resolve (consistent with the admin-curated model).
- **Core loop:** open app → pick my city → see nearby places on the map → select a place → see what's on there → (if the source provides it) click through to buy. The product no longer depends on any legally-blocked source.
- **Geographic scope (locked): Timișoara + București only** for now; architecture must stay extendable to more cities (city is config, not hardcoded).
- **Adapter scope (revised 2026-06-28 after source research — was "build all"): build a FEW (2–4) high-value, legally-defensible adapters well.** Research confirmed every RO source is bespoke **HTML scraping** (the API/iCal/RSS/JSON-LD rungs are mostly empty — see [research todo](history/2026-06-28-competitor-research-findings.md)), so "build all" meant many fragile parsers for a POC. Reversed: build a small clean set; **"all sources" is post-POC expansion**. Per-source terms vetted individually as each adapter is added.
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
- **A city is its municipal boundary, not a box (owner, 2026-10-04).** The sync queries inside the city's administrative area, so Giroc, Dumbrăvița or Bragadiru town halls no longer count as Timișoara's or București's. Rejected: keeping the bounding boxes (the metro area). Found by brief 08's capture.
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
- **Healthcare means public healthcare** (brief 25, 2026-10-03): `healthcare=hospital|clinic|centre` plus `amenity=clinic|hospital|doctors`. The bare `healthcare=*` key also fetched pharmacies, dentists, labs and opticians, about 1,000 of București's 3,177 named places. A pharmacy is not a public resource for this map. `amenity=doctors` stays for now, as a separate call. The bare `sport=*` key was measured and kept (few gyms or shops; see the 2026-10-03 log).
- **Event horizon / recency:** the **map, what's-on, and reminders** show **upcoming events only** (now → optional ~90-day cap). When an event's end passes it flips to **past/archived status** (excluded from those surfaces) but is **retained** — for dedup + reconcile history AND as the data behind the **archived-events page** ([brief 14](../briefs/done/14-archived-events-page.md)): a public `/archive` (citywide past events + a logged-in "my past favorites" tab), each linking to its still-existing place. ~~A periodic prune removes very old archived rows~~ **Revised 2026-10-04 (owner): no prune; past events are kept for good.** SQLite holds years of a city's events easily, and the archive is the product's memory. _Applies consistently across ingestion, what's-on, reminders, the archive page, and DB-growth control._

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
- **Per-adapter extraction** is source-specific. Mechanics tracked in [open-questions.md](open-questions.md); full spec in [briefs/todo/04-event-ingestion-pipeline.md](../briefs/done/04-event-ingestion-pipeline.md).
- Ingestion endpoints live behind the **admin gate** (the same auth; admin-only role/flag). Geocoding is shared infra (cached venue → coords).

## Map / UI model (locked 2026-06-28 — supersedes the original event-centric UI)

The current 3-surface UI (`/map` resource markers · standalone `/events` grid · `/resources/:id`) was built for the old event-centric model and is now partly wrong. New model — **place-centric, map is home:**

- **Pin = place**, colored by **category** (color-per-category, already decided), with a **small badge/dot when the place has upcoming events** (a plain marker can't express "library with 3 events"). The current `ResourceMarkers` component must change to encode category-color + event-presence.
- **Selecting a pin opens a place panel** showing the place's identity (what it is, address, hours) **+ its event list** (each event: date, title, **buy-link only if the source provided one**). This **merges** the old resource-detail + event-list concepts into one surface.
- **`/resources/:id` collapses into a unified PLACE surface.** One model whether reached by pin-click (panel) or deep link (full page) — do not maintain two divergent place views.
- **A deep link's place decides the city** (brief 24, 2026-10-03). Opening `/places/:id` for a place in another city switches to that city (`adoptCity`: persisted, keeps the selection) so its pins load. While a place is open, the place route owns the camera, and a city switch does not recentre.
- **Standalone list view survives but is reframed:** no longer the event-centric `/events`, but a citywide **"what's on" index** — all upcoming events across the current city's places, each **linking back to its place on the map**. A secondary date-first lens on the same data, not a separate data model.
- **City picker is a primary Navbar control** (NEW), scoped to **Timișoara / București**, **defaulting to Timișoara** (or nearest of the two if geolocation is granted), persisted via `locationStore`. "Center on me" is a separate optional button; the app works fully with geolocation denied.

## UI interactions & features (locked 2026-06-28 — full grilling pass; detail split across [brief 13 public UI](../briefs/done/13-ui-interactions-and-features.md), [brief 15 draw-to-filter](../briefs/done/15-draw-to-filter.md), [brief 16 admin shell/review](../briefs/done/16-admin-shell-and-review-ui.md))

- **Place panel:** identity + events **grouped by date** (Today / This weekend / Later), first ~5 then expand, empty state. Event row = title/time/EventCategory dot/buy-link-if-present.
- **Selection:** pin click **pans + zoom-to-fits** so the pin clears the panel/sheet, scales 32→40px, deep-links to `/places/:id`.
- **Filtering is multi-axis, all AND-ed + shared with the what's-on list:** PlaceCategory chips + an **event-timing lens** ("today"/"this weekend") + **draw-to-filter**. The timing lens **HARD-filters (removes) non-matching places, not dims** (revised 2026-06-28 stress-test — dimming is invisible at pin density; show a banner + count + clear).
- **Pin clustering is a day-one legibility requirement** (revised 2026-06-28 stress-test — moved out of brief 12's "defer until perf"): cluster at city zoom; per-pin category color + event badge resolve only when zoomed past overlap.
- **Stress-test edge cases (locked 2026-06-28; detail in briefs 13/15/16):** draw = explicit mode toggle (locks pan); drawn shape persists across pan/zoom/panel/what's-on, cleared on city change; zero-results = guided recovery overlay (removable filter chips + widen hint), never a blank map; favorite-while-logged-out = contextual login prompt then complete the favorite; `/places/:id` = full page+mini-map when cold/shared, panel-over-map in-app, draggable mobile sheet; mobile = collapsing chrome (filters/draw behind one button) to keep the map the hero; new-event notifications coalesced per (place, accept-batch) to avoid bell floods.
- **Draw-to-filter (NEW; [brief 15](../briefs/done/15-draw-to-filter.md)):** free-hand + polygon over the map; **client-side point-in-polygon** over loaded city places (`@turf/boolean-point-in-polygon` or a small helper); ephemeral, one shape, clearable, live result count; ANDs with other filters. ~~**Draw plugin: `@geoman-io/leaflet-geoman-free`**~~ (validated 2026-06-28 — Leaflet.draw is unmaintained since 2018 and lacks freehand; Geoman is maintained + has freehand + react-leaflet/TS/Vite support). **Revised 2026-10-03 (brief 15): no draw plugin.** Geoman's freehand is Pro-only (free 2.20.2 has none) and its polygon tool cannot be finished from our own Done button without private API, so both modes are hand-rolled on Leaflet (pointer capture + `LineUtil.simplify`; click-placed corners), saving a ~4 MB dependency. Rejected: Geoman for polygon + hand-rolled freehand (two drawing mechanisms for one feature). Cost: no vertex editing; Redraw replaces it. Saved per-user areas deferred. **Confirmed by the owner 2026-10-04.**
- **What's-on list** honors the same active filters (incl. drawn area), links each event back to its place.
- **Auth screens:** dedicated centered-card routes (`/login` `/register` `/verify` `/reset`), not over the map.
- **/admin (NEW — own contextual menu; [brief 16](../briefs/done/16-admin-shell-and-review-ui.md)):** separate layout + **sidebar nav** (Sources, Review queue, Places, later Users) + exit-to-public; route-lazy-loaded, admin-gated. **Review screen** = dense filterable table (source→status) + sticky bulk accept/reject toolbar + row→detail drawer with map preview + ambiguous-match resolver.
- **Notifications:** Navbar **bell + unread badge + dropdown** (items link to place/event) + mark-all-read + full view.
- **States & a11y on every surface:** loading (skeleton) / empty (copy+action) / error (retry); WCAG AA — keyboard map+panel nav, focus management, ARIA, 4.5:1 category contrast, category never color-only.

## Public API surface added for the place-centric UI (2026-09-04)

- `GET /api/places` now takes a comma-separated `category` list and a `lens` (`today` | `weekend` | `all`), and every row carries **`upcomingEventCount`** — computed as a correlated subquery so a map of pins costs one request, not one per pin. `lens=today|weekend` **hard-filters** places to those holding an event in the window, per the locked UI decision.
- **The map loads the whole city by paging, not by one big page** (brief 20, 2026-10-03). The 1000-row maximum stays; `fetchAllPlaces` fetches every page in parallel (capped at 10 pages, with a console warning past it). Paged lists carry a total order (`place.id`; what's-on `start_date, event.id`) so pages never overlap or skip. Brief 12's viewport fetching may replace this later, but it must keep search and the count honest.
- `GET /api/places/:id/events` — a place's programme: live and not yet over, in date order.
- **An event is shown while `now` is inside `[start, end]`** (brief 19, 2026-10-03). Pin counts, the lens filter, the programme and what's-on all ask whether the event's span *overlaps* the lens window, through one predicate (`liveInWindow` in `backend/src/routes/event-window.ts`). A null end date is a point event: shown until it starts. A running event groups under **Today** in the UI with "until {date}".
- `GET /api/whats-on` — the citywide date-first index, honouring the same city/category/lens filters so the map and the list can never disagree. Each row carries the place it happens at.
- `backend/src/lib/time.ts` owns every Europe/Bucharest window calculation (`lensWindow`, `zonedTimeToInstant`), with the 90-day horizon. DST-correct via a two-pass offset, no dependency.
- **Note on Drizzle:** a correlated subquery must be built with the query builder, not a raw `sql` template. A raw template renders its columns unqualified, so `place_id = id` silently resolves both sides to the subquery's own table and every count returns zero. This cost a debugging round; it is in the code as a comment.

## Data conventions (locked 2026-06-28)

- **Dates: UTC ISO 8601 strings** in the DB; convert to **Europe/Bucharest only at compute/display** (reminder sweep, today/weekend grouping). Centralized TZ logic.
- **PKs: `randomUUID()` everywhere + unique natural-key constraints** for dedup (place osmType+osmId, geocode_cache address, favorites, notifications).
- **No universal soft-delete:** lifecycle via **status enums**; hard-delete only transient rows.
- **Two category enums:** `PlaceCategory` + `EventCategory` (separate taxonomies, color-coded per-enum).
- **Dependency policy:** minimal, **exact-pinned**, justified per add in its brief; prefer a tiny helper over a heavy lib, but don't hand-roll mature solved problems (drawing). New this session: `vitest`, `@vitest/coverage-v8`, `@playwright/test` (brief 11), `argon2` (brief 02; removed 2026-10-03 by brief 27, Ward holds credentials now), ~~`@geoman-io/leaflet-geoman-free` + `@turf/boolean-point-in-polygon` (brief 13)~~ (neither installed: brief 15 hand-rolled the drawing and the ray cast, 2026-10-03). All exact-pinned; confirm latest stable versions at install time.

## Favorites & notifications (locked 2026-06-28)

- **Two favorite entities:** (both re-keyed to `subject` in 2026-09-06's Ward cutover)
  - `favorite_place` (subject → placeId) — drives "new here" notifications.
  - `favorite_event` (subject → eventId) — drives day-before reminders. _Distinct from favoriting a place; "remind me before this" only makes sense for a specific event the user intends to attend._
- **Notifications: IN-APP inbox + EMAIL (revised 2026-06-28 after research — was in-app-only).** The in-app inbox/bell stays (testable, natural read-model); **email is added as a second delivery channel on the same notification rows**, reusing the auth verify/reset email infra (console-logged in dev, provider before launch). Rationale: Bandsintown/Apple Music confirm the **away-from-app ping** is the core of the retention loop the POC exists to demo; in-app-only was the weakest part of the story and email is cheap given the infra already exists.
- **Revised 2026-10-06 (owner): Ward sends the email.** Replaces 2026-10-04's "in-app only for now". Ward mails a granted, verified user on prm's behalf; prm never holds an address ([Ward brief 17](../../../wzd_auth/corpus/briefs/done/17-app-notification-mail.md), [brief 32](../briefs/todo/32-notification-email-through-ward.md)). Rejected: Ward exposing addresses to app keys.
- **Email is blocked on Ward (found 2026-10-03, brief 05).** prm knows people only by Ward's opaque subject and holds no addresses, and the "auth email infra" it would reuse was removed with the cutover. The in-app inbox shipped; email needs Ward to expose a verified address to an app's key, or to send on the app's behalf. `notification.emailed_at` is the idempotency marker either way.
- **Web/native push is still OUT** for the POC — the noted #1 post-POC retention upgrade (service worker + VAPID, iOS caveats).
- Email sends are best-effort/idempotent off the same `notification` rows (don't double-send on retries).
- **Two triggers create inbox items:**
  1. **New-events trigger** — fires **synchronously at the admin-accept step**: when an admin accepts new events at a place, create inbox items for users who `favorite_place`d it. (Not at scrape time — unaccepted events don't notify.)
  2. **Day-before reminder** — a **once-a-day scheduled sweep running IN-PROCESS inside the Fastify API service** (not a separate pm2 process, not OS cron; distinct from the rejected *ingestion* cron — this one only reads accepted events + writes inbox rows, nothing legally/data sensitive). Semantics: **daily sweep at a fixed local time (e.g. 09:00 Europe/Bucharest)** selects `favorite_event`s whose start is the **next calendar day in Bucharest time**, inserts reminder inbox rows. **Idempotent** via a unique constraint on `(subject, eventId, kind='reminder')` so restarts/double-runs never duplicate. Timezone comparison is **Europe/Bucharest**, not UTC (events are ISO 8601 strings).

## Testing (locked 2026-06-28)

- **E2e-first via Playwright**, but **assertion-based** against a **seeded deterministic DB** (`db:seed`) — not screenshot-eyeballing. Mock geolocation/network for repeatable runs.
- ~~**Plus a thin Vitest suite for auth internals only** — password hashing, single-use reset tokens, session expiry~~ **Obsolete since the Ward cutover (brief 10, 2026-10-04):** prm hashes nothing and issues no tokens. Its side of auth is the Ward client suite (`ward.client.test`, `ward.plugin.api.test`).
- **Signed-in e2e runs against a fake Ward (owner, 2026-10-04).** The e2e stack starts a small stand-in Ward (reusing the backend's `fake-ward.ts` idea) so favourites, the bell and the admin queue are under `npm run test:e2e`. Rejected: the local Ward container (ties the suite to Docker and another repo's checkout) and staying signed-out (leaves TP-05 to TP-07 manual).
- Component tests and broader unit coverage are deferred, not chasing coverage numbers.

## Deployment (locked 2026-06-28)

- **Single VPS** via the `bootstrap-vps-deploy` pattern: **Caddy** (automatic HTTPS — required for geolocation + Secure cookies) serving the static SPA, **pm2** running **one process: the Fastify backend** (which serves the REST API *and* runs the in-process daily reminder sweep), and a **host volume for `app.db`** (SQLite in a container without a persistent volume loses the DB on redeploy).
- **No separate cron process** (corrects the earlier plan): ingestion is admin-triggered (no cron); the only scheduled job — the day-before reminder — runs **in-process inside the Fastify API** (see Favorites & notifications). The previously-planned "separate ingestion cron pm2 process" no longer exists — don't provision it.
- Not serverless/PaaS for v1 — SQLite persistence + cron + a real filesystem fit a VPS far better.

## Known/accepted issues

- **`npm audit`: 4 moderate (esbuild GHSA-67mh-4wv8-2f99).** Sole source is `drizzle-kit`'s transitive `@esbuild-kit/core-utils → esbuild@~0.18.20`. Accepted, not fixed: (1) dev-tooling only — `drizzle-kit` never ships to production and isn't used by any npm script (migrations run via `drizzle-orm`'s migrator through `tsx`; drizzle-kit is only for manual `generate`); (2) the advisory requires running esbuild's dev server, which `drizzle-kit generate` does not; (3) `0.31.10` is the latest stable and still pins the vulnerable esbuild — only `1.0.0-beta`/`rc` drop it; (4) an `esbuild` override won't apply because `@esbuild-kit/core-utils` uses the incompatible 0.18 platform-package layout. `npm audit fix --force` would *downgrade* drizzle-kit to 0.18.1 — do not run it.

## Data model

- **Bounding-box proximity** for spatial queries (not Haversine, not PostGIS) — acceptable approximation for city-scale; revisit if performance degrades at scale.
- **ISO 8601 strings** for all dates in the DB (SQLite has no native date type).
- **`randomUUID()`** (Node built-in) for IDs — no external UUID library.
- **Join rows have no id; `notification_event` is keyed on its pair** (decided 2026-10-03, brief 29, by the brief run; **confirmed by the owner 2026-10-04**). The composite primary key `(notification_id, event_id)` with `ON DELETE CASCADE` from `notification`, which is the shape 0001 actually deployed. Rejected: `schema.ts`'s old surrogate `id` plus a unique pair index. Why: a join row has no identity of its own, so an `id` is a second key that can disagree with the first, and a notification's events should go when it does. Cheap to revisit only until brief 05 writes rows.
- **The migrated database is the schema** (brief 29). `migrations.test.ts` builds one database from the migrations and one from `schema.ts` alone (drizzle-kit's API) and compares columns, indexes and foreign keys. A hand-written migration that drifts now fails `npm test`, where before only drizzle-kit's snapshots were compared, which is how 0001's drift went unseen. `CURRENT_TIMESTAMP` and `datetime('now')` defaults count as equal (same text).

## Owner decisions, 2026-10-04 (Q&A after briefs 08 and 10)

- **Data contact is a placeholder: `johndoe@example.com`.** It fills `VITE_DATA_CONTACT` (the takedown address on `/about-data`) and the contact in `NOMINATIM_USER_AGENT`. The owner replaces it with a real address before launch. Nominatim's usage policy expects a reachable contact, so geocoding at any volume waits for the real one.
- **Email notifications: in-app only for now** (see Favorites & notifications).
- **Signed-in e2e: a fake Ward** (see Testing).
- **Cities are clipped to their municipal boundary** (see OSM resource ingestion).
- **The phone's place sheet keeps two snaps** (peek and full). Rejected: a third half-height stop, as brief 13 offered. Two is simpler to drag and nothing was missing.
- **Past events are kept for good**; there is no prune (see Ingestion & data mechanics).
- **First event sources:** the run researches a shortlist of public calendars (museums, theatres, city halls in both cities) with their feed type and terms, into a todo. The owner vets and adds them; nothing is added without that.
- **Confirmed as taken by the brief runs:** brief 29's `notification_event` shape, and brief 15's hand-rolled drawing instead of Geoman.

## Owner decisions, 2026-10-06 (open questions, one at a time)

- **Ward is asked only on routes that need a user** ([brief 30](../briefs/done/30-resolve-ward-only-where-needed.md), built 2026-10-07). Revises the root `preHandler` in [decisions-identity.md](decisions-identity.md).
- **First sources: Filarmonica Banatul and Teatrul Național Timișoara, with descriptions.** Terms read 2026-10-06: both are public institutions with no terms-of-use page and nothing like iaBilet's art. 28.3; robots.txt allows the feeds; TNTM's footer says "Toate drepturile rezervate". The owner accepted republishing descriptions with the source link shown. Added by the owner after [brief 31](../briefs/done/31-ical-wordpress-shortcodes.md).
- **No "tickets now available" trigger.** Two triggers are enough.
- **The audit's watch list is promoted** ([33](../briefs/done/33-watch-list-hardening.md), [34](../briefs/todo/34-osm-retires-deleted-places.md)).

## Owner decisions, 2026-10-07

- **București stays places-only for now, with no event sources.** Its OSM places carry the map there; no feed is added. Rejected for now: asking publishers to switch on an iCal export, a JSON-LD adapter for event pages, and retrying the venues that did not answer the 2026-10-04 probe ([shortlist](history/2026-10-04-source-shortlist.md)).
