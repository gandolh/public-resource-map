---
summary: Only the genuinely unresolved: per-source terms as sources are added, threshold tuning that needs real data, and secondary items.
updated: 2026-10-07
---

# Open Questions

Only genuinely unresolved questions. Delete an entry the moment it's answered — its history goes in `log.md`. For decided items, see [decisions.md](decisions.md).

> **2026-06-28 — most mechanics now decided.** A grilling pass resolved the matching algorithm, change-detection tiers, geocode-sanity checks, OSM tag-mapping shape, address-normalization, spatial-index question, and the event-horizon/recency lifecycle — all moved to [decisions.md](decisions.md) and the relevant briefs. What remains genuinely open is **only what requires real-world probing or real data to settle**.

## Event sources — per-publisher landscape (Timișoara + București)

The *approach* is locked (place-centric, public primary publishers, **API-first/scrape-last**, a **few clean defensible adapters**, OSM carries the map — see [decisions.md](decisions.md)). Timișoara's first two sources are decided (Filarmonica Banatul and Teatrul Național, 2026-10-06; added after [brief 31](../briefs/done/31-ical-wordpress-shortcodes.md)). București stays places-only for now (2026-10-07). Still open:

- **Per-source terms** — vet reuse by hand as each further source is added.
- **iaBilet (blocked)** — POC-only adapter; permission/official feed is a hard launch blocker; do not enable in production.

## Threshold *tuning* (needs real data, not a decision)

The *mechanisms* are decided; the exact numbers must be tuned once real RO data flows:

- **Venue-match fuzzy-score thresholds** (high = auto, mid = ambiguous→admin, low = geocode). Algorithm locked (normalize + token-set/trigram); start conservative, tune from observed false-match / queue-volume rates.
- **Geocode confidence floor** — the Nominatim importance/confidence cutoff; tune against observed bad pins.

## Secondary (revisit if it bites)

- **Notification mail mixes languages** (brief 32, 2026-10-07). prm writes the mail in Romanian, and Ward wraps every app's text in an English footer naming the app. A Ward-side change (a per-app or per-language footer) would fix it; prm cannot.
- **R-tree / spatialite spatial index** — NOT needed for the POC (city-scoped bbox + `(lat,lng)`+city index is sufficient — see [decisions.md](decisions.md) / brief 12). Documented future option only; revisit if query latency shows up at real volume.
