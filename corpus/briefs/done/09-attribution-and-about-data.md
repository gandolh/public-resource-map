# Brief 09 — Attribution & "about the data" transparency

> Written 2026-06-28. Depends on **brief 06** (UI surfaces to attach to). Part legal-compliance (ODbL/CARTO require attribution), part trust feature. Implements the attribution notes scattered across decisions.md.

## Goal

Make the app **licence-compliant** for its data sources and **transparent** about where its data comes from — a requirement (ODbL), not polish.

## Requirements (confirmed from OSM Foundation guidelines)

- **Map-corner attribution:** `© OpenStreetMap contributors` linking to https://www.openstreetmap.org/copyright, in a corner of the map. **Plus CARTO basemap attribution** (the tiles have their own credit). Must be readable (WCAG contrast); may be collapsible but present.
- **Per-event source credit:** each event shows which public source it came from (the primary publisher), with a link to the original listing where applicable. This is both courtesy to the source and reinforces the link-out posture.
- **Geocoding credit:** if Nominatim is used, follow its attribution/usage requirements.

## "About the data" page

A small static page (linked from the Navbar/footer) explaining:
- **Resources** come from OpenStreetMap (ODbL), synced periodically.
- **Events** come from named public primary-publisher sources (list them), are admin-curated/verified, and link back to originals.
- **What we don't do:** we don't sell tickets; we link out. We don't scrape reuse-restricted aggregators.
- **iaBilet POC disclaimer:** the iaBilet integration (if present in a build) is a proof-of-concept pending permission and is disabled in production. (See [decisions.md → Legal posture](../../wiki/decisions.md).)
- Contact / takedown path (a source publisher can ask to be removed).

## UI placement

- Map corner: attribution control (Leaflet's built-in attribution control is fine — populate it with OSM + CARTO).
- Footer or Navbar: a link to "About the data".
- Place panel / event row: source credit + original link.

## Acceptance criteria

- The map always shows `© OpenStreetMap contributors` (linked) + CARTO attribution, readable in light/dark.
- Every event displays its source and links to the original where available.
- An "about the data" page exists, lists sources + licences, states the link-out/no-ticket-sales posture, includes the iaBilet POC disclaimer + a takedown contact.
- Attribution survives the place-centric UI refactor (not dropped when ResourceMarkers changes).

## Outcome (2026-10-03)

Done, except one item only the owner can supply: **the takedown contact
address.**

- **Map corner.** The attribution now reads `© OpenStreetMap contributors (ODbL)`
  (it said `© OpenStreetMap`), plus CARTO when CARTO tiles are served. The control
  carries an "About the data" prefix link. Leaflet renders it as HTML, so its
  click is routed through the SPA (`AboutDataLink` in `routes/map.tsx`). A full
  page load would drop the drawn area and the selection.
- **`/about-data`.** A static page (`routes/about-data.tsx`, RO and EN) covers:
  - places from OSM under ODbL, with links;
  - which tiles are served;
  - events from public primary publishers only, human-checked, credited and
    linked;
  - what we don't do: sell tickets, or take from reuse-restricted aggregators;
  - the iaBilet proof-of-concept disclaimer;
  - the removal path.

  It is linked from the desktop nav ("Despre date"), the map attribution and the
  what's-on footer, which also stopped crediting CARTO when OSM tiles are served.
- **The page says the events are samples.** Every event today is synthetic
  (status.md), so the page states it in a callout. **When brief 04 lands, remove
  that callout and list the real sources.**
- **Per-event credit.** In the place panel, "Sursa: <publisher>" links the
  original listing (`sourceUrl`), falling back to the URL's host when there is
  no `sourcePlatform`. What's-on rows show it as text, because the whole row
  already links to the place.
- **Owed: `VITE_DATA_CONTACT`.** The removal address comes from this variable,
  documented in `.env.example`. Unset, the page says the address is still being
  set up. Set it before launch; until then the acceptance item "includes a
  takedown contact" is not met.
- **Worth knowing:** the dev seed credits real institutions (with real URLs) for
  invented events. The UI now displays that credit, so a seeded database must
  never be public. That was already the seed's own rule.

typecheck, `npm test` (113 + 3 todo) and `npm run build` are green. In the
browser (desktop, on a reseeded scratch DB):
- The attribution shows the new text and the link, and the link reached the page
  without a reload.
- The nav marks the page active.
- The place panel credit links `primariatm.ro/anunturi`.
- All seven what's-on rows name their source.
