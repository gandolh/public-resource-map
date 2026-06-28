# Research: similar platforms & improvement ideas (2026-06-28)

Captured from a competitive/landscape scan. Source links at the bottom. Actionable items are flagged **[ACTION]**; some challenge locked decisions (flagged **[REVISIT]**).

## Closest comparables

| Platform | What it is | What we can steal |
|---|---|---|
| **Bandsintown** | Follow artists → get notified of nearby shows + reminders + ticket-link alerts. **This is our exact retention loop.** | Their loop is *follow an entity → auto-notify when something new/nearby → remind before → alert when tickets drop*. We follow **places/events**; they follow **artists**. Same mechanic. |
| **AllEvents** | Aggregates events from many sources; **Map View** for nearby discovery. | Validates map-based discovery + multi-source aggregation as a real category. |
| **Fever / TimeOut** | Curated "what's on" in a city; TimeOut uses human editors. | Curation-as-quality (matches our admin-accept gate); "what's on this weekend" framing. |
| **Localist (Concept3D)** | Enterprise event aggregator: ingests **iCal/.ics, RSS, CSV, APIs (Eventbrite/SeatGeek)**. | Confirms our **API-first, scrape-last** order is exactly how legit aggregators operate — feeds, not scraping. |
| **OSM for Cities** | Browse 200+ urban-infra categories per city, **download as GeoJSON**, built on OSM. | A possible **alternative to running Overpass ourselves** — pre-processed city extracts. |

## Key findings & ideas

### 1. [ACTION] data.gov.ro is a legally-clean event source we missed
- **"Calendarul evenimentelor culturale 2025"** exists on **data.gov.ro** under **Open Government Licence Romania (OGL-ROU 1.0)** — explicitly free to reuse/redistribute. Portal supports machine-readable formats + DCAT-AP metadata + has an API.
- **Why it matters:** this is an *officially reuse-licensed* cultural-events feed — the opposite of iaBilet's ToS problem. It directly attacks our biggest weakness (clean event sources are scarce). Should be probed as a **priority source** for brief 04, possibly *the* anchor event source, ahead of bespoke per-publisher scrapers.

### 2. [ACTION] Probe for venue iCal/RSS feeds before writing any scraper
- Localist-style aggregators ingest **iCal/.ics** and **RSS** from venues/institutions. Romanian theatres/museums/town halls running calendar software often expose these unadvertised. Our "API-first, scrape-last" discovery step (already locked) is validated — but we should make **iCal probing a concrete checklist item** per source, since it's the highest-leverage, most-stable feed type.

### 3. [ACTION] Consider OSM-for-Cities GeoJSON extracts vs. raw Overpass
- For Timișoara/București, pre-processed per-category GeoJSON could be simpler + politer than hand-rolling Overpass queries. Evaluate during brief 03; keep Overpass as fallback. Either way it's ingest-once-into-SQLite.

### 4. [REVISIT] In-app-only notifications are weaker than every comparable
- Bandsintown (and Apple Music's new concert feature) win retention via **push + email** — the away-from-app ping. We locked **in-app-only** for the POC. That's fine *as a POC scope decision*, but the research confirms it's the weakest part of our retention story vs. the field. Our architecture already treats email/push as additive — worth keeping that seam clean and flagging push as the obvious post-POC retention upgrade.

### 5. [IDEA] "Ticket link dropped" alert (Bandsintown's "Set Reminder")
- Bandsintown notifies when a *ticket link is added* to an event you tracked. Maps onto our model: an event ingested without a buy-link that later gains one (on a refresh → `changed`) could fire an inbox item. Cheap add on top of our reconciliation + favorites — a third notification trigger worth considering.

### 6. [IDEA] Curation as the differentiator (TimeOut/Fever)
- Our admin-accept gate isn't just data hygiene — it can be a *product feature* ("hand-picked / verified events"), a positioning angle vs. raw scraper-aggregators.

## Round 2 — probing the actual RO source landscape (sobering)

Deeper probes deflated the optimistic round-1 reads:

- **[CORRECTION] data.gov.ro cultural calendar is a dead end.** "Calendarul evenimentelor culturale 2025" = a single **static XLSX from Consiliul Județean Cluj**, last updated Feb 2025, **no API, no Bucuresti/Timisoara coverage**. Not the clean anchor it appeared to be. (There's a separate "Vitalitatea Culturală a Orașelor" dataset — analytics, not event listings.)
- **[FINDING] The "above scraping" rungs are mostly empty in Romania.** Probed MNArt Timișoara (museum) and OneEvent.ro — **both static HTML, no JSON-LD, no RSS, no iCal, no API.** The locked "API-first, scrape-last" order is correct, but in practice most RO sources land on the *scrape* rung. Plan for HTML scraping as the common case, not the exception.
- **[FINDING] City aggregators are the real comprehensive layer — but they're competitors.** Zile și Nopți (City Guide Media SRL) + OneEvent.ro aggregate ~41 cities each. Scraping *them* recreates the iaBilet ToS/legal problem one level up (commercial DB, likely reuse-restricted). Not a clean shortcut.
- **[FINDING] Municipal/project calendars exist** (Centrul de Proiecte Timișoara, timisoara-info.ro) — publicly-funded, more defensible to reuse, but still HTML. These + individual venues are the realistic primary-publisher set.

**Net:** the legally-clean *and* machine-readable *and* comprehensive event source does not exist for RO. You can have at most two of the three. This is the core tension to decide (see grill variants 2026-06-28).

## Sources
- [10 best event-discovery apps (MakeUseOf)](https://www.makeuseof.com/mobile-apps-for-nearby-events/)
- [Bandsintown — event notifications](https://help.artists.bandsintown.com/en/articles/7039447-event-notifications) · [event reminders](https://help.artists.bandsintown.com/en/articles/7048835-event-reminders) · [Wikipedia](https://en.wikipedia.org/wiki/Bandsintown)
- [Bandsintown powers Apple Music concert listings (iOS 26.4)](https://www.prnewswire.com/news-releases/bandsintown-powers-concert-listings-on-apple-music-with-the-release-of-ios-26-4--302727486.html)
- [Localist — importing iCal/RSS/CSV/API feeds](https://help.concept3d.com/hc/en-us/articles/11938562146579-Importing-Feeds-to-Localist)
- [OSM for Cities — browse/download city data](https://osmforcities.org/en) · [OSM Key:amenity](https://wiki.openstreetmap.org/wiki/Key:amenity)
- [data.gov.ro](https://data.gov.ro/) · [Calendarul evenimentelor culturale 2025](https://data.gov.ro/dataset/calendarul-evenimentelor-culturale-2025)
