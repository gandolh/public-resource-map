# Open Questions

Only genuinely unresolved questions. Delete an entry the moment it's answered — its history goes in `log.md`.

## Map library

**Which mapping library?**
- **Leaflet** — OSM tiles, open source, lighter, well-known
- **Mapbox GL JS** — vector tiles, better performance for many pins, requires API key + paid tier at scale
- **react-map-gl** (Mapbox wrapper) — better React integration
- **Decision needed before** the home page can be implemented.

## Data sources

**Where does resource/event data come from?**
- iabilet.ro was mentioned as an example event platform; no scraper written.
- Public resource data (parks, libraries, etc.) could come from OpenStreetMap Overpass API.
- Should the backend include a scraper/cron job, or is data entered manually via the API?

## Authentication

**Is user auth needed?**
- The profile dropdown (Account / Settings / Logout) exists in the Navbar, implying auth is planned.
- No auth system is in place yet.
- What provider? (email/password, OAuth via Google, magic link?)

## Spatial indexing

**Should proximity queries use a spatial index?**
- Current bounding-box approximation works for small datasets.
- SQLite has no built-in spatial index; could use `spatialite` extension or a manual R-tree via `better-sqlite3`.
- Revisit when data volume or query latency becomes an issue.

## Backend deployment

**How is the backend deployed?**
- UI has a Dockerfile; backend has none yet.
- Options: same server as UI, separate container, serverless.
