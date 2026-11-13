# Data sources

<!-- Generated from shared/src/sources.ts by `npm run sources`. Edit the registry, not this file. -->

Every outside source the app reads data from. The registry in `shared/src/sources.ts` is the record;
this file is generated from it, and a test fails when the two disagree.

| Source | Kind | Host | Used for | How it arrives | Licence | Reuse | Credit | Terms checked |
|---|---|---|---|---|---|---|---|---|
| OpenStreetMap (`openstreetmap`) | osm | overpass-api.de | Every public place on the map, through the Overpass API | Synced into the database when an admin asks | [ODbL 1.0](https://opendatacommons.org/licenses/odbl/) | Permitted | [© OpenStreetMap contributors](https://www.openstreetmap.org/copyright) | 2026-06-28 |
| Nominatim (`nominatim`) | geocoder | nominatim.openstreetmap.org | Coordinates for an event venue no OpenStreetMap place matched | Asked during an admin refresh, cached for good | [ODbL 1.0](https://opendatacommons.org/licenses/odbl/) | Permitted | [© OpenStreetMap contributors](https://www.openstreetmap.org/copyright) | 2026-06-28 |
| OpenStreetMap tiles (`osm-tiles`) | tiles | tile.openstreetmap.org | The basemap when no CARTO key is set | Fetched by the visitor's browser | [ODbL 1.0](https://opendatacommons.org/licenses/odbl/) | Permission pending | [© OpenStreetMap contributors](https://www.openstreetmap.org/copyright) | never |
| CARTO basemaps (`carto`) | tiles | basemaps.cartocdn.com | The basemap (Positron and Dark Matter) when a CARTO key is set | Fetched by the visitor's browser | [CARTO basemap terms](https://carto.com/attributions) | Permission pending | [© CARTO](https://carto.com/attributions) | never |
| Filarmonica Banatul (`filarmonica-banatul`) | event-publisher | filarmonicabanatul.ro | Concerts in Timișoara, from its public iCal feed | Read when an admin refreshes it; a person accepts each event | None stated | Permission pending | [Filarmonica Banatul](https://filarmonicabanatul.ro/evenimente/) | 2026-10-06 |
| Teatrul Național Timișoara (`teatrul-national-timisoara`) | event-publisher | tntm.ro | Performances in Timișoara, from its public iCal feed | Read when an admin refreshes it; a person accepts each event | All rights reserved (site footer) | Permission pending | [Teatrul Național Timișoara](https://www.tntm.ro/) | 2026-10-06 |
| iaBilet (`iabilet`) | event-publisher | iabilet.ro | Nothing in production; a proof-of-concept integration only | Read when an admin refreshes it; a person accepts each event | [iaBilet terms of use](https://www.iabilet.ro/terms/ro/) | **Forbidden** | [iaBilet](https://www.iabilet.ro/) | 2026-06-28 |

## Where the credit is shown

- **On the map:** the attribution corner names the tiles in use, OpenStreetMap, and the publisher of every
  event venue on screen. It links to the About page.
- **On a place:** its panel names the source of the place (OpenStreetMap, or the publishers whose events
  created it), and each event names its publisher.
- **On the About page** (`/about-data`): the licences, in Romanian and English, with the approved event publishers.

## Carve-outs

Only a `forbidden` source is kept off the public map; a `permission-pending` one is published and credited.
A source is never left out of this list to hide it. To flip one, change its `reuse` in the registry,
run `npm run sources`, and deploy: its rows leave (or come back to) the public places and events at once,
and nothing is deleted.

### OpenStreetMap tiles (`osm-tiles`)

- **Reuse:** `permission-pending`. Nobody has recorded a check of its terms. The app uses it and credits it. A fork must read the terms itself before going public, then set `reuse` to `permitted` or `forbidden` and record the date.
- **Terms:** The OSM Foundation's tile usage policy; no reading of it is recorded.
- **Checked:** never. Research: [corpus/wiki/decisions-ui.md](corpus/wiki/decisions-ui.md).

### CARTO basemaps (`carto`)

- **Reuse:** `permission-pending`. Nobody has recorded a check of its terms. The app uses it and credits it. A fork must read the terms itself before going public, then set `reuse` to `permitted` or `forbidden` and record the date.
- **Terms:** Served only with an API key since 2026-09-04; no reading of CARTO's terms is recorded.
- **Checked:** never. Research: [corpus/wiki/decisions-ui.md](corpus/wiki/decisions-ui.md).

### Filarmonica Banatul (`filarmonica-banatul`)

- **Reuse:** `permission-pending`. Its permission is not settled. The app uses it and credits it. A fork must read the terms itself before going public, then set `reuse` to `permitted` or `forbidden` and record the date.
- **Terms:** A public institution with no terms-of-use page and nothing forbidding reuse; robots.txt allows the feed. The owner accepted republishing listings and descriptions with the source link shown (2026-10-06). It has not granted permission, so it stays permission-pending (owner, 2026-11-13).
- **Checked:** 2026-10-06. Research: [corpus/wiki/history/2026-10-04-source-shortlist.md](corpus/wiki/history/2026-10-04-source-shortlist.md).

### Teatrul Național Timișoara (`teatrul-national-timisoara`)

- **Reuse:** `permission-pending`. Its permission is not settled. The app uses it and credits it. A fork must read the terms itself before going public, then set `reuse` to `permitted` or `forbidden` and record the date.
- **Terms:** A public institution with no terms-of-use page and nothing forbidding reuse; the footer says “Toate drepturile rezervate”, and robots.txt allows the feed. The owner accepted republishing listings and descriptions with the source link shown (2026-10-06). It has not granted permission, so it stays permission-pending (owner, 2026-11-13).
- **Checked:** 2026-10-06. Research: [corpus/wiki/history/2026-10-04-source-shortlist.md](corpus/wiki/history/2026-10-04-source-shortlist.md).

### iaBilet (`iabilet`)

- **Reuse:** `forbidden`. Its terms forbid reuse. The API never publishes its rows: they are held back from every public place and event, including rows published before the source was flipped. A fork must keep it `forbidden`, and must not publish its content anywhere, until the publisher gives permission in writing.
- **Terms:** Art. 28.3 forbids taking, reproducing or publicly communicating any of the site's content, in whole or in part. Permission is a hard blocker before any public use.
- **Checked:** 2026-06-28. Research: [corpus/wiki/decisions.md](corpus/wiki/decisions.md).
