# Task 01: A source registry, and map links that can be shared

## Context

On 2026-11-09 the owner had the skills library review popular repos for
ideas that help their apps (the review is filed in the owner's skills
library as briefs 17-26). One of them, **bilawalsidhu/gods-eye-view**, read
at `e5da073` (2026-11-09, MIT), is a 3D globe of live public data:
aircraft, ships, satellites, weather, public cameras. It is the estate's
closest relative to this app: public sources, each with its own licence,
on a map.

Three of its practices fit here:

1. **A `DATA_SOURCES.md` that carves out, rather than omits.** Every source
   gets a row: the host, what it is used for, its licence, and whether it is
   fetched live or bundled. A dataset whose licence doesn't fit is bundled
   with a clear carve-out ("commercial users must delete it"), not hidden.
   Attribution is shown in the app, per layer, and the file says where.
2. **Share links.** The camera, style, layers and one tracked target
   serialise into the URL, so a link opens the same view ("a live target is
   a handoff, not a bookmark").
3. **One module per layer.** Each data layer is its own module, so a source
   is added without touching the others.

### What this app has today (2026-11-04, `afb2f9f`)

- The legal posture is locked in `decisions.md` ("Legal posture", "Source
  discovery: API-first, scrape-last"). OSM through Overpass is the clean
  anchor (ODbL). Event sources are public primary publishers, and some
  sources are blocked from public launch until permission is obtained.
  iaBilet's terms forbid reuse.
- `ui/app/routes/about-data.tsx` states the licences in prose (106 lines,
  RO and EN). The map's attribution string is assembled in
  `ui/app/lib/map.ts` (`MAP_ATTRIBUTION`: OSM, and CARTO when its tiles are
  in use).
- The ingestion adapters live in `backend/src/ingest/adapters.ts`.
  `corpus/wiki/history/2026-10-04-source-shortlist.md` holds the research
  on each source's terms.
- The map's state lives in a zustand store (`useAppStore`): the city, the
  search, the filters, the selected place. It is not in the URL, so a link
  to the map opens the default city with nothing selected. Only `/place/:id`
  can be shared.

What is missing is one machine-readable place that says, per source, what
it is, its licence, whether reuse is permitted, and what attribution it
needs. Today the About page, the map credit and the adapters each carry
their own copy, and nothing stops an adapter for a reuse-forbidden source
from feeding the public map.

## Owner decisions (defaults)

1. **The registry is code, not prose.** Default:
   `shared/src/sources.ts` exports one entry per source. Each entry has:
   - an `id` and a `kind` (`osm` / `event-publisher` / `geocoder` /
     `tiles`);
   - the `host`;
   - the `licence`;
   - `reuse`: `permitted` / `permission-pending` / `forbidden`;
   - the `attribution` (RO and EN);
   - a `termsCheckedOn` date;
   - a link to its research.

   `DATA_SOURCES.md` at the repo root is generated from it. Alternative: a
   hand-written `DATA_SOURCES.md` only.
2. **The registry credits, and only `forbidden` is kept off** (owner,
   2026-11-10, the skills library's open questions, Q38). An adapter must
   name its source id. Rows from a `permitted` or `permission-pending`
   source are published as today, each **credited to its source** on the
   place and in the map credit. A row from a `forbidden` source never
   reaches the public map. When a site objects, an admin sets its source to
   `forbidden`, and its rows leave the public places and events at the next
   publish. Record this as a revisit of the "Legal posture" decision, with a
   `log.md` entry.
3. **The map state goes in the URL.** Default:
   `/map?city=timisoara&q=…&f=library,park&place=123`. These are the same
   fields the store holds, with zoom and centre only when the user moved the
   map. The store reads the URL on load and writes to it with `replace`, not
   `push`, so Back doesn't step through every pan. Alternative: a "Copy
   link" button that encodes the state, with the URL left as it is.
4. **Per-layer modules.** Default: not now. The app has one layer of places,
   plus events inside places, and modules pay off at several layers. Note it
   in `open-questions.md` instead.

## Files you OWN

- `shared/src/sources.ts` (new) and its test.
- `scripts/generate-data-sources.ts` (new) and `DATA_SOURCES.md` (new,
  generated).
- `backend/src/ingest/adapters.ts` and `pipeline.ts`: each adapter names
  its source, and the publish step reads `reuse` (only `forbidden` is held back).
- `ui/app/routes/about-data.tsx`, rendered from the registry, keeping its
  wording.
- `ui/app/lib/map.ts`: the attribution string built from the registry's
  tile and OSM entries.
- `ui/app/routes/map.tsx` and the store module, for the URL state.
- `corpus/wiki/decisions.md` (the revisit), `architecture.md`,
  `open-questions.md`, `status.md`, `log.md`.

## Files you must NOT touch

- The review queue's UI and the accept/diff rules. The `forbidden` check
  adds a condition; it doesn't change the flow.
- The geocoder's call budget.

## What to do

1. List every source the code touches. Grep the adapters, the geocoder, the
   tile URLs and the OSM sync. Write each into `sources.ts`, with its
   licence and reuse status taken from `decisions.md` and the source
   shortlist. Any source with no recorded terms check gets
   `permission-pending` and an open question.
2. Generate `DATA_SOURCES.md` with a carve-out section for every
   `forbidden` or `permission-pending` source, saying what a fork must do.
   Add an `npm run sources` script, and a test that fails when the file is
   stale.
3. Make adapters declare their source, and hold back `forbidden` sources.
   Test that a row from a `permission-pending` source reaches the public
   API with its source credit, and that a row from a `forbidden` source
   (including one flipped after it was published) does not.
4. Render the About page and the map credit from the registry. Check the RO
   and EN copy against today's, unchanged unless the registry corrects a
   fact.
5. Put the map state in the URL. Test that a copied URL opens the same city,
   search, filters and selected place, and that Back leaves the map rather
   than undoing pans.

## Acceptance

- `DATA_SOURCES.md` exists, is generated, and the staleness test passes.
- No adapter can be registered without a source id (a type error), and the
  credit and `forbidden` tests pass.
- The About page and the map credit come from the registry, in both
  languages.
- A map URL with `city`, `q`, `f` and `place` opens that view on a fresh
  load, at 1280 and 390 px.
- `npm run typecheck`, the tests and the builds pass.
- `decisions.md` has the revisit, and `log.md` has the entry.
