# CivicMap — Design System

<!-- impeccable:design-doc 1 -->

Recorded from the **shipped** UI, not from intentions. Where this document and
the code disagree, the code in `ui/app/app.css` is right and this file is stale.

Product truth: [`PRODUCT.md`](PRODUCT.md). Why this world exists and what it
replaced: [`../corpus/wiki/decisions.md` → Visual direction](../corpus/wiki/decisions.md).

## The direction, in one paragraph

The public layer of a city, made findable. Offered four visual worlds, this
product deliberately took **the category convention** — floating search, pill
filter chips, teardrop pins, a docked side panel on desktop, a draggable bottom
sheet on mobile — and committed to executing it precisely rather than replacing
it with something novel. The craft bar is **Citymapper and Linear**: precise and
dense over soft and generous. "Looks like every other map app" is an accepted
trade. "Looks less finished than Citymapper" is not.

Direction contract seed: `6c65d315`, recorded in `app/root.tsx` and greppable in
the production build.

---

## Rules that are load-bearing

These are not preferences. Each one was paid for during the build, and breaking
any of them breaks the system somewhere non-obvious.

1. **A 1px border is the default separator.** Shadow is spent only on what
   genuinely floats, and it differs by role.
2. **Pills mean "filter" and nothing else.** Counts, category badges and
   disclosure controls use `rounded-md`. If it is fully rounded, it narrows what
   you are looking at.
3. **The accent owns "selected".** Filter chips, the timing lens, the language
   toggle, and the selected map pin's ring all use it. Nothing else may invent a
   second selection colour.
4. **Category meaning is never carried by colour alone.** Hue always ships
   alongside a drawn icon and a written label. The cluster's event indicator is a
   counted chip, not a coloured dot, for this reason.
5. **`EventCategory` reuses the eleven `PlaceCategory` hues** via a map in
   `lib/categories.tsx`. Two taxonomies, one palette — sixteen hues would stop
   any hue meaning anything, and the two enums never appear on the same mark.
6. **Base element rules must live inside `@layer base`.** Written unlayered they
   outrank every Tailwind utility at any specificity; an unlayered
   `a { color: inherit }` silently defeated every `text-*` utility on every link
   in the app.
7. **No webfont monospace.** `--font-mono` is a system stack, used only for real
   identifiers (an OSM way id, a stack trace). Small tracked-uppercase labels use
   `.label-cap` in the UI face.
8. **`--fg-faint` must clear 4.5:1.** It carries real body copy and every input
   placeholder — it is not a decorative tone.

---

## Color

Strategy: **restrained** — neutrals plus one accent, which is correct for a
surface someone came to operate. Neutrals carry a cool bias; they are picked,
not inherited grey. Both themes are designed, not inverted.

### Neutrals and text

| Token | Light | Dark | Role |
|---|---|---|---|
| `--bg` | `#f7f9fb` | `#0b0d11` | Page ground |
| `--surface` | `#fcfdfe` | `#14171d` | Panels, sheets, cards, chrome |
| `--surface-2` | `#f1f4f8` | `#1a1e25` | Hover, inset blocks, date tiles |
| `--surface-3` | `#e6ebf2` | `#222731` | Skeletons |
| `--line` | `#e3e6ec` | `#262b34` | Default separator |
| `--line-strong` | `#ccd2dc` | `#363d49` | Hover borders, scroll thumb, grabber |
| `--fg` | `#0d1117` | `#eef1f5` | Primary text |
| `--fg-muted` | `#59636f` | `#99a2b0` | Secondary text |
| `--fg-faint` | `#697281` | `#8d96a5` | Labels, placeholders — **4.72:1 / 6.12:1** |
| `--fg-on-accent` | `#ffffff` | `#0b0d11` | Text on the accent |

### Accent and semantic

| Token | Light | Dark |
|---|---|---|
| `--accent` | `#2a5bef` | `#6d9bff` |
| `--accent-hover` | `#1f4bd8` | `#85adff` |
| `--accent-weak` | `#eef2fe` | `#16203a` |
| `--accent-line` | `#c7d5fb` | `#2c3f6b` |
| `--ok` / `--ok-weak` | `#0b7d55` / `#e6f5ef` | `#34d399` / `#0e2a22` |
| `--warn` | `#9a5b00` | `#fbbf24` |
| `--danger` / `--danger-weak` | `#c62f2f` / `#fdeced` | `#fb7185` / `#2c1218` |

Semantic colour is separate from the accent and never used decoratively.

### Category hues

Eleven, one per `PlaceCategory`. Light values are dark enough to carry a white
glyph at 32px and to clear 4.5:1 as text on `--surface`; dark values are lifted
to hold against a dark basemap.

| Category | Light | Dark |
|---|---|---|
| `park` | `#157f4a` | `#34c77b` |
| `library` | `#9c5c00` | `#e3a223` |
| `clinic` | `#c4342a` | `#f2695f` |
| `museum` | `#6d3fb0` | `#b083f0` |
| `townhall` | `#0f6e8e` | `#35b0d8` |
| `community_center` | `#b03a86` | `#ee72bd` |
| `education` | `#3a37a8` | `#8b88f5` |
| `theater` | `#c2410c` | `#f0863f` |
| `sports` | `#4d7c0f` | `#9bcc3c` |
| `cultural_center` | `#0f766e` | `#2bbfad` |
| `other` | `#566072` | `#93a0b4` |

Map chrome: `--pin-stroke` (`#ffffff` / `#14171d`) is the pin and cluster rim;
`--pin-ico` (`#ffffff` / `#0b0d11`) is the glyph, which flips dark in dark mode
because the fills there are light.

---

## Typography

**Archivo** (variable, 400–700, Google Fonts) as the single family. A signage
grotesque with the compression and x-height to hold at 12px, and with real
Romanian diacritics (ă â î ș ț) rather than fallback glyphs. Chosen over Geist
and Inter, both of which are overused enough to read as a default.

`--font-mono` is a **system stack** (`ui-monospace, SFMono-Regular, Menlo,
Consolas`) — no webfont — and appears only on identifiers.

| Role | Size / line | Tracking | Where |
|---|---|---|---|
| Page title | 26–30px / 1.15 | −0.025em | What's-on `h1`, place page title |
| Panel title | 19px / 1.2 | −0.02em | Place panel and sheet |
| Section | 13–14.5px, 600 | −0.01em | "Ce se întâmplă aici", state titles |
| Body | 14.5px / 1.5 | — | `body` default |
| Secondary | 12.5–13.5px | — | Addresses, meta values, event rows |
| Label (`.label-cap`) | 10.5px, 600 | 0.13em, uppercase | Group headers, menu labels, field labels |
| Micro | 11.5–12px | — | Counts, hints, attribution |

`.tnum` (`font-variant-numeric: tabular-nums`) on every column of digits: result
counts, event times, date tiles, cluster and pin badges.

---

## Shape, elevation, motion

**Radii** cap at 12px. `--radius-xs` 4 · `sm` 6 · `md` 8 · `lg` 10 · `xl` 12 ·
full 999px **reserved for filter chips, the timing lens and badges**.

**Elevation by role** — a chip, a panel and a pin must not share a shadow:

| Token | Role |
|---|---|
| `--sh-1` | Resting chrome — chips, the segmented control, count pills |
| `--sh-2` | Floating overlays — search field, filter card, map controls |
| `--sh-3` | Panel and bottom sheet |
| `--sh-pin` | Map markers only (tight, dark) |

In dark mode depth comes from surface tone; shadow only stops things floating.

**Motion** — `--ease: cubic-bezier(.2,.8,.2,1)`, durations `--dur-1` 120ms /
`--dur-2` 180ms / `--dur-3` 240ms. Fast and confident: no bounce, no spring.
`prefers-reduced-motion` collapses everything to 0.01ms.

Two things learned the hard way and encoded here: **a filled CSS animation
outranks inline style** (an entrance keyframe ending on `transform:
translateY(0)` with `fill-mode: both` permanently defeated the sheet's own snap
transform), and the sheet therefore animates **transform only**, never `height`.

---

## Browser surfaces

Themed rather than left to the browser: text selection, caret and `accent-color`,
custom scrollbars (`--line-strong` thumb on a `--bg` inset ring), focus rings
(2px `--accent`, 2px offset, `:focus-visible` only), and underline offset.

---

## Components

**Button** — `primary` (accent fill, `--sh-1`), `secondary` (surface + 1px
border), `ghost`, `danger`. Heights 32 / 36 / 44, radii `md`/`lg`. One primary
action per surface; secondary carries a border rather than a fill so a row of
actions does not read as three equal choices.

**Chip** — the filter primitive, and the only pill. 32px tall, category dot +
label + optional count. Active: accent fill, accent border.

**Segmented** — the timing lens. Mutually exclusive options, so the shape says
"pick one". `w-fit`, accent fill on the selected segment.

**SearchInput** — 40px, 1px border, `--sh-2`, focus ring from `--accent-line`
plus a 2px accent glow. Clear button appears only with a value.

**CategoryBadge** — hue + drawn icon + written label, `rounded-md`, `color-mix`
tint at 10% ground and 34% border. Not a pill: it states what a place *is*.

**StateBlock** — one shape for empty, zero-results and error. Sparse event data
is the normal case here, so this explains *why* something is empty rather than
leaving a blank rectangle.

**Skeleton** — pulses; does not sweep a gradient, which would read as a second
kind of motion competing with the map.

### Map markers

**Pin** — 30px teardrop (38px selected), `--pin-stroke` 2.5px rim, category
fill, `--pin-ico` glyph, `--sh-pin`. Anchored at the tip. Event count rides in an
inverted corner chip (`--fg` ground, `--bg` numeral). Selected adds an
**accent** ring — not the category hue, which on its own fill is barely a ring.

**Cluster** — the same white rim and the same inverted corner chip, so pins and
clusters read as one family. Radius scales across five steps by count
(32/37/42/47/52). The large centred numeral means *places*; the corner chip
means *events*. Definition comes from a `--line-strong` hairline in the shadow,
not a heavy dark border.

### Icons

Authored on a 24 grid at stroke 2, round caps and joins, stored as raw path data
in `lib/categories.tsx` so the *same* drawing renders in React and inside a
Leaflet `divIcon`. Two sources would drift and a pin would stop matching its list
row. lucide supplies chrome icons at the same grid and weight.

---

## Layout

**Desktop** — full-bleed map. Search + filter card top-left (352px), timing lens
bottom-centre, place panel docked right (384px, inset 12px). The map control
stack shifts left when the panel opens; a familiar affordance is moved, never
deleted.

**Mobile** — a genuinely different composition, not a reflow. Search + a filter
button carrying an active-count badge, the timing lens and a live result count
below it, the map as the hero, a two-snap draggable sheet (peek 0.46 / full
0.82 of the viewport), and a bottom tab bar that hides while the sheet is up.
The sheet's maximum extent stops clear of the map's own chrome.

---

## Map integration (Leaflet)

- **One stacking context**: `.leaflet-container { z-index: 0 }`. Leaflet stacks
  its own panes and controls from 200 to 1000; containing them means app chrome
  (400+) sits cleanly above without fighting each layer. Setting z-index on
  `.leaflet-control-container` does nothing — it is statically positioned.
- **`MapContainer` applies `className` only at creation.** Anything reactive
  must go on a wrapper element.
- **Attribution is a licence obligation.** Bottom-left (never under the docked
  panel), no leaf prefix, themed to `--fg-faint` on a translucent surface, and
  lifted above whichever snap the mobile sheet rests at. No state ships tiles
  unattributed.
- **Basemap**: CARTO Positron / Dark Matter behind `VITE_CARTO_API_KEY`.
  Without a key, CARTO's endpoints return a watermark tile, so the app falls back
  to OpenStreetMap raster tiles filtered toward the same quiet register
  (`.map-fallback`, with a dark-mode inversion) and swaps the attribution to
  match. **Known open item:** in dark mode the fallback tiles carry a warm cast
  against cool chrome. A CARTO key resolves it.

---

## Accessibility

WCAG AA. Category meaning never rests on colour. `--fg-faint` clears 4.5:1 in
both themes, measured at the rendered pixel. Focus moves into the place panel on
open and Escape closes it. Markers are keyboard-reachable with real `alt` text;
clusters carry a title. `prefers-reduced-motion` is honoured. The app is fully
usable with geolocation denied — location is a button, never a dependency.

---

## Review status

Finish review: three rounds, disposition **ship**; eleven material fixes and
three regressions scored resolved. That verdict covers what was captured —
**login and register, the loading/empty/error states, and every dark-theme
surface except the desktop place panel were never captured and so were never
reviewed.** Not a clearance of the whole surface.
