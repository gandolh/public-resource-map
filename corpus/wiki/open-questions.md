# Open Questions

Only genuinely unresolved questions. Delete an entry the moment it's answered — its history goes in `log.md`. For decided items, see [decisions.md](decisions.md).

> **2026-06-28 — most mechanics now decided.** A grilling pass resolved the matching algorithm, change-detection tiers, geocode-sanity checks, OSM tag-mapping shape, address-normalization, spatial-index question, and the event-horizon/recency lifecycle — all moved to [decisions.md](decisions.md) and the relevant briefs. What remains genuinely open is **only what requires real-world probing or real data to settle**.

## Event sources — per-publisher landscape (Timișoara + București)

The *approach* is locked (place-centric, public primary publishers, **API-first/scrape-last**, build a **few clean defensible adapters**, OSM carries the map — see [decisions.md](decisions.md)). Genuinely open because it can only be answered by probing real sites:

- **Which specific publishers, and what's each one's machine-readable surface?** Per Timișoara/București town hall, museum, cultural institution: official API? **iCal/`.ics`** (common + often unadvertised)? RSS/Atom? JSON-LD? clean sitemap? — before falling back to HTML. Probe in discovery order; record `mechanism` per `event_source`.
- **Per-source terms** — vet reuse legality by hand as each adapter is added.
- **iaBilet (blocked)** — POC-only adapter; permission/official feed is a hard launch blocker; do not enable in production.

## Threshold *tuning* (needs real data, not a decision)

The *mechanisms* are decided; the exact numbers must be tuned once real RO data flows:

- **Venue-match fuzzy-score thresholds** (high = auto, mid = ambiguous→admin, low = geocode). Algorithm locked (normalize + token-set/trigram); start conservative, tune from observed false-match / queue-volume rates.
- **Geocode confidence floor** — the Nominatim importance/confidence cutoff; tune against observed bad pins.

## Ward on the public path for signed-in visitors (raised 2026-09-27)

The locked design resolves a Ward session in a **root** preHandler whenever a `ward_session` cookie is present, and states as a consequence that "the public map never asks Ward anything". That holds for anonymous visitors only. The cookie is estate-wide (`Path=/`, shared origin), so anyone signed into *any* estate app carries it, and every public request from them waits on verification/introspection (cached 30s; the key set re-fetches every 10 min). A refusing Ward fails fast; a **slow** one adds up to the 5s timeout to public-map requests. Open: should the session be resolved lazily, only inside `requireAuth`/`requireAdmin` and `/api/me`, to make the property literal? See the [audit](../todos/2026-09-27-improvements-audit.md).

## Secondary (revisit if it bites)

- **R-tree / spatialite spatial index** — NOT needed for the POC (city-scoped bbox + `(lat,lng)`+city index is sufficient — see [decisions.md](decisions.md) / brief 12). Documented future option only; revisit if query latency shows up at real volume.
