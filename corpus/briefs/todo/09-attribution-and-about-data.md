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
