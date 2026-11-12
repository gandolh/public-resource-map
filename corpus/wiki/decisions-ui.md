---
summary: Visual direction and interface decisions: the 2026-09-04 design system that replaced CivicMap Material, interface language, the basemap constraint, and (2026-11-11) the theme switch and the Base UI conventions, and (2026-11-12) the map state in the URL.
updated: 2026-11-12
---

# Decisions — visual direction and interface

Split out of [decisions.md](decisions.md) on 2026-10-04, when that page passed ~200 lines. Unchanged in the move. The full design spec is [`ui/DESIGN.md`](../../ui/DESIGN.md).

## Visual direction (locked 2026-09-04 — REPLACES the earlier CivicMap design system)

The 2026-06-29 "Warmer Editorial-Civic" system (steel-blue Material tokens, Fraunces + Inter, amber accent) is **retired**. It was never built, and the UI it was written for is gone.

- **The direction is the category convention, executed at full fidelity.** Four visual directions were designed and shown as running coded mockups (a land-registry sheet, a transit diagram, an orienteering overprint, and the standard). The user chose **the standard, deliberately**, as the permanent standing exit — floating search, pill filter chips, teardrop pins, a docked side panel on desktop, a draggable bottom sheet on mobile. This is a commitment, not a fallback: **future work does not "rescue" it with a novel visual world.**
- **The craft bar is Citymapper and Linear.** Precise and dense over soft and generous: tight type, crisp 1px borders in preference to diffuse shadows, restrained colour with one accent, tabular numerals wherever digits align, motion at 150–220ms ease-out with no bounce or spring. "Looks like every other map app" is an accepted trade. "Looks less finished than Citymapper" is not.
- **Typeface: Archivo** (variable, Google Fonts), one family for everything. Chosen over Geist/Inter — both are on the overused-face list, and Archivo is a signage grotesque with a large x-height that holds at 12px and real Romanian diacritics rather than fallback glyphs. **No webfont monospace:** monospace is reserved for genuine identifiers (an OSM way id, a stack trace), and the small tracked-uppercase utility labels use the UI face.
- **Colour: restrained.** Cool-biased neutrals plus **one** blue accent (`#2a5bef` light / `#6d9bff` dark). Eleven `PlaceCategory` hues are *information*, and **`EventCategory` reuses the same eleven** rather than adding eight more — two taxonomies, one palette, and the two enums never appear on the same mark.
- **Elevation by role:** a 1px border is the default separator; `--sh-1` for resting chrome, `--sh-2` for floating overlays, `--sh-3` for the panel and sheet, and a separate tight `--sh-pin`. A chip, a panel and a pin must not share a shadow.
- **Radii cap at 12px**; pills are reserved for filter chips and badges, so the pill shape keeps meaning "this narrows what you see".
- **Both themes ship.** The use scene forces it: bright daylight outdoors on a phone, and a laptop indoors. How the choice works is under [The theme switch](#the-theme-switch-2026-11-11).
- The authoritative token reference is **`ui/DESIGN.md`**, derived from the built system. [design.md](design.md) is now a pointer, not a spec.

## The theme switch (2026-11-11)

The owner's call of 2026-11-10 (Q18): Light, Dark and System everywhere, light on a first visit.

- **Light is the default**, whatever the operating system says. System follows the operating system and its changes live. The choice is kept on the device under `vite-ui-theme` (the template's key, kept so existing choices survive).
- **`data-theme="light|dark"` on `<html>`** holds the resolved theme; there is no `dark` class. `@custom-variant dark` and the dark token block (`:root[data-theme="dark"]`) read it, and `color-scheme` follows it in the same stylesheet. No component reads `prefers-color-scheme`.
- **A boot script in the head** (`THEME_BOOT_SCRIPT` in `ui/app/lib/theme.ts`, written into the page by `root.tsx`) applies the stored choice before the first paint, so a returning dark visitor never sees a light flash. One `theme-color` meta carries the page background (`--bg`) and follows the switch; a test keeps the script's, the provider's and the stylesheet's colours equal.
- **The control stays the menu in the top bar.** Its three items are radio items, so a screen reader hears which is chosen. The map follows the theme (CARTO tiles with a key; without one the standard tiles are inverted in CSS).

## Base UI by the conventions (2026-11-11)

The base-ui skill's rules, applied to this app (brief 04). `check-base-ui` is strict; the exceptions are in `scripts/conventions.json`.

- **One wrapper per primitive** in `ui/app/components/ui/`: Popover, Dialog (controlled, Escape guard, initial focus), Drawer (`BottomSheet`), toast (a manager, `notify()`, a host at the root), Tabs, Segmented (a `RadioGroup`), Chip (a `Toggle`), Checkbox, Select (with `items` and a `name`), plus the existing Menu. Feature code never imports `@base-ui/react`.
- **Device settings are radio groups** (rule 16): the timing lens, the draw mode and the language switch. Arrow keys move and choose; one option is always on. Nothing in this app saves a picker to the server, so there is no `ToggleGroup`. The brief had put the language switch on a guarded `ToggleGroup`; the skill's later table wins, because the language is stored on the device.
- **The place sheet is a non-modal Drawer.** The spike passed: with `modal={false}`, no backdrop and `disablePointerDismissal`, the map still pans and its pins still open another place while the sheet rests at its peek, with a mouse and with touch (an e2e spec holds it). Snap points are the old 46 and 82 percent of the viewport; a swipe down drops a snap and closes from the peek, and so do Esc and the X.
- **Error toasts stay until dismissed.** The one notice today (a drawn area cleared by a city change) is information and closes after five seconds.
- **The stylesheet is in layers**: `theme, base, vendor, components, utilities`. Leaflet's CSS is `layer(vendor)` after `base`; the app's Leaflet and pin rules are in `components`. Only the two token blocks sit outside a layer, and `!important` is left only in the reduced-motion rule (an accepted rule-7 exception). The focus ring no longer sets a `border-radius`, so it follows each element's own radius.
- **Named scales, same values.** The 17 text sizes are `--text-*` (`text-meta` for 12px, and so on), the z-indexes are `--z-index-*` (`z-chrome` 400 up to `z-popup` 1000), durations use `--dur-1` and the easing is `ease-out-fast`. A new token's name also goes into `cn()` in `ui/app/lib/utils.ts`.
- **Category hues are a `--cat` custom property**, set inline from data and read by `bg-(--cat)` and the like; the pin rules stay CSS (Tailwind does find a class written whole inside a string, but the per-category variables and `color-mix` read better as CSS).

## The map's state in its URL (2026-11-12)

- **A map URL is a share link:** `/?city=timisoara&q=…&f=library,park&when=today&map=15/45.75390/21.22570`, and `/places/:id?…` with a place open. `city`, `q` and `f` are the store's city, search and categories, `when` its lens, and `map` (zoom/lat/lng, OpenStreetMap's order) the camera, written only once the user moved the map. The drawn area stays out (ephemeral). `place=<id>` is an alias for the path, and the old `/map?…` keeps its query.
- **The store reads the URL once on load; every change goes back with `replace`,** so Back leaves the map instead of stepping through pans. Opening a place still pushes. A link that names a city wins over the visitor's stored city and location; a place's own city still wins over the link's. Parameters the map doesn't own (a favourite waiting for sign-in) are kept. Copy link copies the place with the view around it, under the base path.
- Rejected: a "Copy link" button that encodes the state while the URL stays bare.

## Interface language (locked 2026-09-04)

- **Romanian by default, English behind a switch.** RO leads because the audience is residents and the UI should agree with the place names; EN exists so the POC can be demoed to a non-Romanian stakeholder. Browser language is deliberately **ignored** — a Romanian with an English-locale phone still lands in Romanian.
- **No translation framework.** `Intl.PluralRules` handles Romanian's three plural forms including the "de" form above nineteen (*1 loc · 3 locuri · 23 de locuri*), and `Intl.DateTimeFormat` handles dates in Europe/Bucharest. Adding i18next to reach platform APIs would be a dependency for a lookup table. Lives in `ui/app/lib/i18n.tsx`.

## Basemap constraint (discovered 2026-09-04)

- **CARTO's keyless raster endpoints no longer serve maps.** `basemaps.cartocdn.com/light_all/...` answers HTTP 200 with a ~2.5KB "API KEY REQUIRED" watermark tile. Leaflet + CARTO stays the locked stack, but the style is now behind `VITE_CARTO_API_KEY`.
- **Fallback while no key is set:** standard OpenStreetMap raster tiles, filtered in CSS toward the same quiet low-saturation register (`.map-fallback` in `app.css`, including a dark-mode inversion). Attribution changes with the provider, because naming CARTO for tiles CARTO did not serve would be false. Getting a CARTO key is a small open task before any public deploy.
- **Basemap style: Positron / Dark Matter**, not Voyager — the map carries eleven category hues plus an accent, and the quieter the basemap the more the pins mean. _(Supersedes the Voyager choice in the retired design system.)_

## Design direction (locked 2026-06-29 — full spec in [design.md](design.md))

Deliberately steered away from the "generic AI" aesthetic (research-driven). The visual direction is **Warmer Editorial-Civic** (was "Minimalist-Professional"):
- **Typography (the biggest personality lever): two families** — **Fraunces** (variable serif, Google Fonts) for display/headings/brand/place-titles; **Inter** for body/UI. New font dependency: Fraunces.
- **Color:** dominant **civic blue** + a deliberate **warm amber accent** (the tertiary token, used as sparing punctuation); slightly warm neutrals (not pure slate); **category meaning never carried by color alone**.
- **Geometry:** tightened rounding (cards ≤8px, drawers 12px, **pills reserved for chips/badges only**); crisp 1px borders preferred over diffuse shadows.
- **Elevation: role-differentiated** — a card, button, badge, and map pin must NOT share one shadow value.
- **Map pins: icon-led + event-aware + zoom-aware** (per-category SVG icon primary, color secondary; event-presence accent ring; dot↔teardrop by zoom; unmistakable selected state). Clusters styled to the system, not default Leaflet.
- **Basemap: CARTO Voyager (light) / DarkMatter (dark)** — warmer than Positron, still clean. Self-hosted brand-tinted style = future, not POC.
