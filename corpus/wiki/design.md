---
name: CivicMap
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daef'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e9edff'
  surface-container-high: '#e1e8fd'
  surface-container-highest: '#dce2f7'
  on-surface: '#141b2b'
  on-surface-variant: '#41474f'
  inverse-surface: '#293040'
  inverse-on-surface: '#edf0ff'
  outline: '#717880'
  outline-variant: '#c1c7d0'
  surface-tint: '#206393'
  primary: '#1c6090'
  on-primary: '#ffffff'
  primary-container: '#3c79ab'
  on-primary-container: '#fdfcff'
  inverse-primary: '#96ccff'
  secondary: '#4c6075'
  on-secondary: '#ffffff'
  secondary-container: '#cfe5fd'
  on-secondary-container: '#52667b'
  tertiary: '#7d5400'
  on-tertiary: '#ffffff'
  tertiary-container: '#9a6c17'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cee5ff'
  primary-fixed-dim: '#96ccff'
  on-primary-fixed: '#001d32'
  on-primary-fixed-variant: '#004a75'
  secondary-fixed: '#cfe5fd'
  secondary-fixed-dim: '#b3c9e0'
  on-secondary-fixed: '#061d2f'
  on-secondary-fixed-variant: '#34495c'
  tertiary-fixed: '#ffddb0'
  tertiary-fixed-dim: '#f6bc62'
  on-tertiary-fixed: '#281800'
  on-tertiary-fixed-variant: '#614000'
  background: '#f9f9ff'
  on-background: '#141b2b'
  surface-variant: '#dce2f7'
typography:
  display:
    fontFamily: Fraunces
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Fraunces
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Fraunces
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Fraunces
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style

The design system is built on a foundation of **Civic Modernism**. It balances the authoritative reliability of a government institution with the fluid, accessible utility of a contemporary digital product. The primary goal is to foster community engagement by making complex urban data navigable and inviting.

The aesthetic follows a **Warmer Editorial-Civic** approach (revised 2026-06-29 — deliberately steers away from the "generic AI" look: Inter-only, all-rounded, blue+slate, uniform shadows. See [research](../todos/2026-06-29-pin-map-aesthetic-research.md)):
- **Trustworthy + human:** Clear civic structure, but with editorial warmth (a distinctive display typeface, a confident accent) so it reads credible *and* characterful — not templated.
- **Accessible:** High-contrast ratios and clear affordances ensure the app is usable by all citizens. Meaning is never carried by color alone.
- **Clean, not generic:** Generous whitespace + "lightweight chrome," but with **intentional, role-varied** elevation/geometry instead of uniformly-soft rounded cards.
- **Functional:** Information density carefully managed for local discovery.

> **Anti-generic rules (be specific, not vague):** distinctive display face for headings/brand (Fraunces) + Inter for body/UI; max card radius 8px (pills only for chips/badges); shadows differ by element role (don't give every element the same shadow); dominant civic blue + a deliberate warm accent (not a timid even palette).

## Colors

The palette is designed for high legibility and rapid category recognition. 

### Semantic System
- **Steel Blue (--color-primary):** Navigation, primary actions, branding. Conveys civic stability — stays the dominant color.
- **Warm accent (--color-tertiary, amber `#7d5400` family — promoted 2026-06-29):** A deliberate, sharp **secondary accent** used sparingly for emphasis, highlights, and "what's on" energy — gives the palette personality vs. a timid all-blue scheme ("dominant color + sharp accent beats an evenly-distributed palette"). Not a third equal color; a punctuation.
- **Category Colors:** Each category uses a distinct, accessible hue, paired with 10% opacity backgrounds for badge legibility. **Color is never the sole signal** — always paired with an icon/label (a11y + the pin system below).
- **Neutral Scale:** Systematic grey scale for secondary text/borders. Keep neutrals slightly **warm** (not pure slate) to match the editorial-civic tone.

### Color Implementation
- **Active States:** Use `primary_color_hex` at 100% opacity for text and icons.
- **Inactive States:** Use neutral greys to de-emphasize non-essential chrome.
- **Category Pairing:** When using category colors on text, ensure a contrast ratio of at least 4.5:1 against the surface.

## Typography (revised 2026-06-29 — two-family pairing)

Typography is the **primary carrier of personality** (the element most resistant to a generic-AI look). Two families:

- **Display — Fraunces** (variable serif, Google Fonts) for **headings, brand wordmark, place titles, and large display text.** A characterful old-style serif with optical sizing + warmth → editorial, human, trustworthy. Use its optical-size axis: tighter/higher-contrast at large sizes. This is where the design earns its distinctiveness.
- **Body/UI — Inter** for body copy, controls, labels, dense UI. Genuinely the best legibility at small sizes; kept deliberately as the workhorse (it's only a problem when used for *everything*).

Usage:
- **Hierarchy:** Fraunces for titles/headlines (the `display`/`headline-*` scale); Inter for `body-*` and `label-*`. Don't set body copy in Fraunces.
- **Labels:** Small labels (`label-sm`) use slightly increased letter spacing (0.05em) + uppercase for "utility" text (timestamps, distances).
- **Line Heights:** Generous for readability across visual abilities.
- **Optical Sizing:** Fraunces handles this natively; for large headings use its high-contrast optical size + slightly negative tracking.
- Load both via Google Fonts (variable); preload the display face for the brand/above-the-fold headings.

## Layout & Spacing

The design system employs a **Fluid-Fixed Hybrid** grid. The map occupies the full viewport, while interface overlays (drawers, search bars) adhere to a strict 4px baseline grid.

### Breakpoints & Reflow
- **Mobile (< 768px):** Elements like "Detail Drawers" become bottom sheets. Margins are reduced to 16px.
- **Desktop (>= 1024px):** A fixed-width (400px) detail panel slides from the right, with a 40px margin from the screen edge.
- **Spacing Rhythm:** Use `md` (16px) for standard internal padding within cards and `lg` (24px) for spacing between distinct sections.

## Elevation & Depth

Visual hierarchy is established through **Tonal Layers** and **role-differentiated elevation** (revised 2026-06-29 — *don't give every element the same shadow*; shadow should signal where a thing sits in 3D, so its role determines its elevation).

- **Level 0 (Base):** The map layer — no shadow.
- **Level 1 (Cards/Search/chips):** A crisp **1px border** (warm-neutral) is the primary separator; shadow is minimal-to-none. Borders over diffuse shadows = sharper, less generic.
- **Level 2 (Active Drawer/Modals/open panel):** A real, deeper shadow (e.g. `0 10px 15px rgba(0,0,0,0.1)`) — reserved for genuinely-elevated, focus-stealing surfaces only.
- **Pins (map):** Their own small, tight drop shadow so they read as "on top of the map" — distinct from card elevation (a pin is not a card).
- **Rule:** at most these tiers; a card, a button, a badge, and a pin must NOT share one shadow value.
- **Surface Contrast:** In dark mode, communicate depth by shifting background→surface tone (e.g. `#111827`→`#1F2937`) rather than heavy shadows.

## Shapes

The shape language is **gently rounded but crisp** (revised 2026-06-29 — tightened; uniform heavy rounding reads generic). Rounding differs by role rather than rounding everything:

- **Standard Elements:** Buttons, cards, input fields use **0.5rem (8px) max** — do not climb higher.
- **Large Elements:** Detail drawers/bottom sheets use **0.75rem (12px)** on the leading corners (was 16px) — slightly crisper.
- **Pills (full radius) reserved for chips & category badges only** — they signal "interactive filter / metadata," so keep the pill shape meaningful by *not* applying it elsewhere.
- Prefer **crisp 1px borders** to define edges where a soft shadow would otherwise be the only separation (sharper, less "bubbly").

## Components

### Map Pins (revised 2026-06-29 — icon-led, event-aware, zoom-aware)

Meaning is carried by **icon + shape + color + state**, not color alone (a11y + scannability when many categories share the map).

- **Icon is the primary signal:** each `PlaceCategory` has a distinct **SVG icon** (lucide), centered in the pin. Category **color is the secondary** cue; the icon must be legible at small size. (SVG, not PNG — crisp at any DPI, themeable.)
- **Shape is zoom-aware:**
  - **Dense / lower zoom:** compact **dot** (cleaner when crowded).
  - **Zoomed-in / selected:** precise **teardrop** with a V-point for unambiguous location.
- **Event-presence is visible at a glance:** places with upcoming events get an **accent ring** (the warm accent) or a small **count badge** — so "where's something on" survives even when clustered.
- **Base:** 32px; **white/contrast border (2px)**, interior in the category color, icon in white (or dark, whichever clears 4.5:1).
- **States:** hover → preview + slight lift; **selected → scale to 40px + a clear selected ring + Level-2 elevation** (unmistakable which pin is active). Non-selected may dim when one is selected.

### Map Clusters (NEW)
- Clusters use a **styled `L.divIcon`** matching the design system (our type + neutral/blue), **not** default Leaflet styling — size tiers by count.
- A cluster containing event-hosting places shows the **same accent hint** (a small dot) so event presence survives clustering.
- Per-pin category color + event badge **resolve only when zoomed in past overlap** (legibility — see brief 13).

### Basemap (revised 2026-06-29)
- **Light: CARTO Voyager** (warmer, more characterful than Positron, still clean — pairs with the editorial-civic tone). **Dark: CARTO DarkMatter.**
- Keep the basemap **low-saturation** so colored pins pop; minimal labels at low zoom. Attribution per [brief 09](../briefs/todo/09-attribution-and-about-data.md).
- _Future:_ a self-hosted, brand-tinted OpenMapTiles/MapTiler style for full control (post-POC — see research).

### Event Cards
- **Structure:** Horizontal or vertical layout depending on container width.
- **Elements:** 1:1 or 16:9 aspect ratio image, title (`headline-md`), date/time (`label-md`), and a category badge.
- **Styling:** White background, 1px neutral border.

### Filter Chips
- **Inactive:** Transparent background, 1px border (#D1D5DB), neutral text.
- **Active:** Primary color background, white text, no border.

### Detail Drawer
- **Desktop:** Slides from the right. Full height. Contains header image, action buttons (Get Directions, Share), and long-form markdown text for descriptions.
- **Mobile:** Bottom sheet with a "drag handle" affordance at the top.

### Sliders (Radius Selector)
- **Track:** 4px height, neutral-grey background.
- **Active Track:** Primary steel blue.
- **Thumb:** 24px circle, primary blue, with a subtle elevation (Level 1 shadow).

### Category Badges
- **Styling:** Background set to category color at 10% opacity. Text color is the category color at full value. Includes a 6px solid color dot on the left of the text label.