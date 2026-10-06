# A shortlist of event sources, for the owner to vet — 2026-10-04

The owner asked for this research (decisions.md, 2026-10-04). It works through
step 1 ("probe API-first") of
the vetting todo (closed 2026-10-06; the two Timișoara feeds are approved, see decisions.md) for the obvious
public venues. **2026-10-06:** the owner approved the two Timișoara feeds below after a terms read; they are added after brief 31. București still has no ready feed.

**How it was probed:** each home page was fetched once, then `?ical=1`. Pages
were checked for `.ics`/`webcal` links, RSS, schema.org `Event` JSON-LD, and the
WordPress "The Events Calendar" plugin. Any feed found was run through prm's
own `parseIcal`. Requests identified as `CivicMap-prm/0.1 research`.

## Ready to add: real iCal feeds the built-in adapter reads today

| Source | City | Feed | Parsed by `parseIcal` | robots.txt | Notes |
|---|---|---|---|---|---|
| Filarmonica Banatul | Timișoara | `https://filarmonicabanatul.ro/evenimente/?ical=1` | 30 events, 0 problems | only `/wp-admin/` disallowed | The Events Calendar 6.10 export. `LOCATION` is a full address ("Sala Capitol, Bd. C.D. Loga 2, …"), not a bare venue name, so expect rows in review until a place is chosen or pinned. Season subscriptions appear as events. |
| Teatrul Național Timișoara | Timișoara | `https://www.tntm.ro/?ical=1` | 27 events, 0 problems | no disallows | Titles carry the stage and date ("… - Studio "UTU Strugari" - 4 oct. 26 19:00"). Descriptions contain a WordPress shortcode with the eventim.ro ticket link, so stripping it would be a small adapter fix. |

Adding one is a row, not code: Sources → Add a source (`ical:<slug>`, the feed
URL, Timișoara). Read the site's terms first.

## Has RSS only (news, not structured events)

Centrul de Proiecte Timișoara (`centruldeproiecte.ro`), Muzeul Satului
Bănățean, Teatrul Național Timișoara (`/feed/`), Biblioteca Județeană Timiș
(`bjt.ro/feed/`), MNAR (Joomla `?format=feed&type=rss`). An RSS item has no
start time or venue field, so these would need a parsing adapter. That makes
them the "scrape" end of API-first, scrape-last.

## No feed found

- **Timișoara:** Muzeul de Artă, Primăria Timișoara, Muzeul Național al
  Banatului, timisoara-info.ro.
- **București:** TNB, Opera Națională, ARCUB, MNAC, Muzeul Municipiului,
  Bulandra, Nottara, Excelsior, Opereta, Muzeul Țăranului Român, Antipa (it
  links `?ical=1`, which returns HTML), Metropolis, MTR, Biblioteca
  Metropolitană (403).
- **Did not answer** (connection failed, worth a retry): Opera Română
  Timișoara (`ort.ro`), Casa de Cultură Timișoara, Filarmonica George Enescu
  (`fge.org.ro`), Biblioteca Națională, Cinemateca, Teatrul Odeon.

**București has no ready feed among these.** The realistic routes are:
- ask a publisher for an iCal export (many use WordPress plugins that have one
  switched off);
- a JSON-LD adapter, if event *pages* carry schema.org data (home pages did
  not; not checked deeper);
- leave București OSM-only for the proof of concept.

A commercial aggregator stays excluded (decisions.md → Legal posture).
