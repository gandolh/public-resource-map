# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two distinct audiences, both first-class:

- **The resident deciding now.** Standing somewhere in Timișoara or București, phone in one hand, asking "what is around me and is anything on there?" Needs the map to be the whole screen and every control inside thumb reach.
- **The resident planning ahead.** At a laptop, browsing what is on this weekend, comparing places, saving things. Wants density, comparison, and hover-depth that a phone cannot give.

Confirmed 2026-09-04: these are equally weighted. The two layouts are separate compositions, not one reflowed breakpoint.

- **The admin/curator** (secondary, internal): runs source refreshes, reviews the ingestion diff, resolves ambiguous venue↔place matches, manually pins un-geocodable venues. A different job, a different surface (`/admin`), not a mode of the public app.

## Product Purpose

Make the public layer of a Romanian city legible on one map: the parks, libraries, clinics, museums and town halls that exist, plus whatever is actually happening at them. Success is the core loop completing without friction — open app → city → nearby places → pick a place → see what's on there → (only if the source published one) click through to buy.

It is an explicit **proof-of-concept**. The tech is demonstrable end to end; public/commercial launch of any reuse-restricted source is blocked on permission. Prioritize real data, a deployable app, and a usable core loop over feature count.

## Positioning

**The unit is the place, not the event.** Every competing product in this space is an event feed with a map bolted on; a listing disappears the moment it is over. Here the map is anchored in OSM civic infrastructure — permanently true, ODbL-licensed, reusable — and events are a thin, sparse, honest layer that attaches to those places. That inversion is the mechanism: the map still works on a week when nothing is on, and a place a user cares about can notify them when something lands there.

The second differentiator is **legal honesty as a product property**: sourced from primary publishers who want to be found, never from a ToS-protected aggregator. A buy-link exists only when the publisher themselves published one.

## Operating Context

- **Two cities only** (Timișoara, București), city is config not hardcoded. City picker is a primary control; geolocation is an optional "center on me", never a dependency.
- **Event coverage is deliberately sparse.** Many places will have nothing on. The empty state is the common state, not an edge case — it must be designed as a first-class condition, never as a failure.
- **Sparse data, no artwork.** Text-only event cards, no scraped imagery — locked for copyright reasons. The interface cannot lean on photography to carry visual interest.
- Data reaches the DB through an admin-triggered, human-reviewed ingestion cycle. Nothing autonomous publishes.
- Romanian place and event names, with diacritics. Copy language is an open decision (RO/EN); typography must handle ă â î ș ț correctly either way.

## Capabilities and Constraints

**Confirmed capabilities:** place map with category pins and event-presence signal; place detail (identity + what's on there, grouped Today / This weekend / Later); citywide what's-on index that links back to places; multi-axis filtering (place category AND event-timing lens AND freehand draw-to-filter), all AND-ed and shared between map and list; archive of past events; email+password auth; favorite a place and favorite an event; in-app notification inbox plus email; admin shell with source health, review queue, ambiguous-match resolver and manual pin tool.

**Technical constraints:**
- React 19 · React Router 8 · Vite 7 · Tailwind 4 · TanStack Query · Zustand · Base UI primitives · lucide icons.
- **Leaflet + react-leaflet on CARTO basemaps — locked by the user 2026-09-04.** No MapLibre/vector-style swap.
- Fastify 5 + SQLite/Drizzle backend; shared Zod schemas.
- Pin clustering is a day-one legibility requirement, not a perf deferral.
- Draw-to-filter uses `@geoman-io/leaflet-geoman-free` + point-in-polygon, client-side over loaded city places.
- Dependencies are minimal and exact-pinned; each addition justified.

**Interface language (locked 2026-09-04): Romanian by default, English behind a switch.** The audience is residents, so RO leads and the UI agrees with the place names; EN exists so the POC can be demoed to a non-Romanian stakeholder. Romanian plural rules (one / few / other, including the "de" form above 19) are handled by `Intl.PluralRules`, and dates by `Intl.DateTimeFormat` in Europe/Bucharest — no translation-framework dependency.

**Themes (locked 2026-09-04): both ship.** The use scene forces it — bright daylight outdoors on a phone, and a laptop indoors.

**Open / undecided:** deployment target beyond "a VPS".

## Brand Commitments

- **The name "CivicMap" is fixed** (confirmed 2026-09-04). Everything else in the current identity — the steel-blue Material token set, Fraunces + Inter, the amber accent, the pin and card language in `corpus/wiki/design.md` — is **explicitly released** by the user and is treated as evidence and anti-reference, not authority.
- **Standing preference: the category convention, executed at full fidelity** (locked 2026-09-04). Offered four directions, the user took the standing exit deliberately — the familiar map-app pattern language (floating search, pill chips, teardrop pins, side panel on desktop, bottom sheet on mobile), played straight, with no irony and no smuggled quirk. This is a commitment, not a fallback: future work does not "rescue" it with a novel visual world.
- **The craft bar is Citymapper and Linear** (locked 2026-09-04). Precise and dense over soft and generous: tight type, crisp 1px borders in preference to diffuse shadows, restrained color with one accent, tabular numerals wherever digits align, and fast confident motion (150–220ms, ease-out, no bounce). "Looks like every other map app" is the accepted trade; "looks less finished than Citymapper" is not.
- Voice: plain, civic, non-hyped. No gamification, no growth-hacking urgency. This does not mean the surface must be quiet or timid.
- Attribution to OpenStreetMap (ODbL) and CARTO is a legal obligation and must be visible on any surface showing their data.

## Evidence on Hand

- A working but old-model UI (`/map`, `/events`, `/resources/:id`) built for the discarded event-centric model, on seeded **NYC placeholder data**. It is the anti-reference.
- A real backend: place-centric 13-table schema, working OSM/Overpass sync, auth with argon2id + opaque sessions, Vitest harness.
- A deep decision record at `corpus/wiki/decisions.md` and a 17-brief backlog — product truth is unusually well established for this stage.
- **No real Romanian data in the app yet** (brief 08). **No event ingestion running yet** (brief 04). Mockups and demos must not imply either exists; illustrative Romanian content must be labeled synthetic and listed for replacement.
- No photography, no logo asset, no testimonials, no usage numbers. None may be invented.

## Product Principles

1. **The place outlives the event.** Anything that makes the app useless on a quiet week is wrong.
2. **Sparse is the honest default.** Design the empty and the thin case first; the full case is the easy one.
3. **The map is the product, not a widget.** Chrome earns its pixels or collapses.
4. **Only show what a publisher published.** No manufactured links, prices, or certainty.
5. **Two devices, two compositions.** Neither audience gets the reflowed leftovers.

## Accessibility & Inclusion

WCAG AA is a stated requirement. Category meaning is never carried by color alone — icon plus label always accompany hue. Keyboard navigation must reach the map, the pins, and the place panel, with managed focus on panel open/close. 4.5:1 minimum for category colors on their surface. The app must be fully usable with geolocation denied.
