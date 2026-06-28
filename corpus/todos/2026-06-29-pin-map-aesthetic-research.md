# Research: pin/map customization + design.md aesthetics (2026-06-29)

Two topics: (A) best-UX map pins + basemap for our place-centric app, (B) what in `design.md` would lift the platform out of the "generic AI" look. Findings feed a proposed design.md revision (pending grill answers). Sources at bottom.

## A. Pins & map

### Pin differentiation — color alone is not enough
- Research consensus: when a map has multiple location *types*, differentiate by **shape + icon + color + state**, not color alone. Aligns with our locked WCAG rule ("category never color-only"). Our current pin (circle + category color + white icon) is *okay* but leans on color; the **icon is the real meaning-carrier** — icon choice per PlaceCategory matters more than hue.
- **Pin shape:** the classic teardrop/pin with a V-point removes location ambiguity (precise target); circles are cleaner + better for dense maps but less precise. For a place map with clustering, a hybrid is common: **teardrop when zoomed-in/selected, dot when dense**.
- **Selection/hover states must be unmistakable** — our 32→40px scale is good; add a clear selected ring/elevation + a hover preview.
- **Event-presence badge** (our differentiator) should read at a glance — a small count badge or accent ring on places that have upcoming events.
- **Format:** SVG markers (crisp at any DPI, themeable via currentColor) over PNG.

### Cluster styling
- `Leaflet.markercluster` clusters are fully stylable via `L.divIcon` + CSS (size tiers by count, brand color). Default clusters look generic — **style them to the design system** (our color, our type) or they'll read as "default Leaflet."
- A cluster can hint **event presence** (e.g. an accent dot) so "where's something on" survives clustering.

### Basemap
- We use CARTO Positron/DarkMatter (light/dark). Options worth weighing:
  - **CARTO Voyager** — warmer, slightly more characterful than the very-neutral Positron; still clean. A cheap way to look less "default."
  - **Positron/DarkMatter** — maximally neutral, lets pins pop (current choice; safe).
  - **Self-host OpenMapTiles / MapTiler custom style** — full brand control (tint the map to the palette), but real setup/hosting cost. Future, not POC.
- Principle: a muted/low-saturation basemap makes colored pins pop; a busy basemap fights them. Keep labels minimal at low zoom.

## B. design.md aesthetics — it currently reads as "generic AI"

The research's description of the generic-AI aesthetic is almost a checklist of our current design.md:
- ❗ **Inter exclusively** — Inter is *the* flagged AI-default font. Typography is "the primary carrier of personality" + "most resistant to generic AI output."
- ❗ **Everything rounded** (8px cards, pills everywhere) — card-heavy + uniform rounded corners is a named tell.
- ❗ **Uniform soft shadows** — "in AI slop every element gets the same shadow." Our Level 1/2 system is better than uniform, but still generic-soft.
- ❗ **Steel-blue accent + slate-gray neutrals** — the exact "blue accent + slate gray" palette called out.

### Levers to de-generic-ify (most impact first)
1. **Typography — biggest lever.** Introduce a **distinctive display/heading typeface** paired with a workhorse body (Inter can *stay* as body — it's genuinely legible — but headings/brand should carry personality). Candidates raised by research: editorial serif (Playfair-ish), a grotesque (Bricolage Grotesque), or a characterful sans. For a *civic/trustworthy* tone, an **editorial-leaning pairing** (a confident display + Inter body) reads credible, not techy-generic.
2. **A real accent beyond steel blue.** Keep blue as primary (it does convey civic stability) but add a **distinctive secondary/accent** with intent (the tertiary amber `#7d5400` already in tokens is a start) — "dominant color + sharp accent beats timid evenly-distributed palette."
3. **Intentional, varied elevation** — differentiate shadow by element role (pins/cards/drawers shouldn't share one shadow); consider crisper borders over diffuse shadows for a sharper, less-soft feel.
4. **Specificity** — the design system should state exact values + bold rules ("max radius 12px", "category pins use icon+shape+color"), not vague "rounded, friendly."
5. **Tone decision needed:** the brief says "Civic Modernism / Minimalist-Professional." Decide whether to lean **warmer/editorial** (more distinctive, human) vs **stay clean-neutral** (safe, but risks generic). This is a taste call for the user.

## Sources
- [Map UI Design best practices (Eleken)](https://www.eleken.co/blog-posts/map-ui-design)
- [Custom map markers complete guide (GeoDirectory)](https://wpgeodirectory.com/how-to-create-custom-map-markers-the-complete-guide/)
- [Google Advanced Markers — graphic/HTML markers](https://developers.google.com/maps/documentation/javascript/advanced-markers/graphic-markers)
- [Leaflet.markercluster custom styling](http://leaflet.github.io/Leaflet.markercluster/)
- [CARTO basemap styles](https://github.com/CartoDB/basemap-styles) · [OpenMapTiles self-host styles](https://openmaptiles.org/styles/)
- [Prompting for frontend aesthetics (Claude Cookbook)](https://platform.claude.com/cookbook/coding-prompting-for-frontend-aesthetics)
- [Why AI-generated UI looks bad — 15 mistakes (GenDesigns)](https://gendesigns.ai/blog/ai-generated-ui-mistakes-how-to-fix)
- [UX/UI trends 2026 — calm interfaces (Envato)](https://elements.envato.com/learn/ux-ui-design-trends)
