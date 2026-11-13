# CivicMap — Design System

<!-- impeccable:design-doc 1 -->

Recorded from the **shipped** UI, not from intentions. Where this document and
the code disagree, the code in `ui/app/app.css` is right and this file is stale.

Product truth: [`PRODUCT.md`](PRODUCT.md). Why this world exists and what it
replaced: [`../corpus/wiki/decisions-ui.md` → Visual direction](../corpus/wiki/decisions-ui.md).

## The direction, in one paragraph

The public layer of a city, made findable. Offered four visual worlds, this
product deliberately took **the category convention** — a search, pill filter
chips, teardrop pins, a docked side panel on desktop, a draggable bottom sheet
on mobile — and committed to executing it precisely rather than replacing it
with something novel. The 2026-11-13 redesign, **"The docked desk"**, moves only
the search: it leaves its floating card for a docked band above the map.
Chips, pins, the docked panel and the sheet stay, and no new visual world was
added. The craft bar is **Citymapper and Linear**: precise and
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
   disclosure controls use `rounded-md` or `rounded-lg`. If it is fully rounded, it narrows what
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
   identifiers (an OSM way id, a stack trace). Labels are sentence case in the
   UI face (`.label-cap` is 12px, 600, no capitals and no tracking): tracked
   capitals fail the design skill's gate.
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
| `--bg` | `#e8ecf1` | `#090b0f` | Page ground, deeper than the surfaces so the band and the column stand off it |
| `--surface` | `#fcfdfe` | `#1c212b` | Band, column, sheet, cards, chrome |
| `--surface-2` | `#f0f3f7` | `#252b36` | Hover, inset blocks, date tiles, group strips |
| `--surface-3` | `#e1e6ed` | `#2e3541` | Pressed fills, skeletons |
| `--line` | `#d8dee6` | `#2f3642` | Inset dividers |
| `--line-strong` | `#c3cad5` | `#3f4856` | Edges of the band, column, sheet, cards and chips |
| `--outline` | `#7f8896` | `#7a8596` | Edge of a control that must be seen: search, Copy link, the star, Draw an area, the grab bar |
| `--fg` | `#131922` | `#edf0f4` | Primary text |
| `--fg-muted` | `#545e6b` | `#a1aab7` | Secondary text |
| `--fg-faint` | `#5f6977` | `#8e98a6` | Labels, placeholders |
| `--fg-on-accent` | `#fbfcff` | `#0c0f14` | Text on the accent |

### Accent and semantic

| Token | Light | Dark |
|---|---|---|
| `--accent` | `#2a5bef` | `#6d9bff` |
| `--accent-hover` | `#1f4bd8` | `#85adff` |
| `--accent-weak` | `#e9effe` | `#1d2b4d` |
| `--accent-line` | `#c3d2fb` | `#2f4474` |
| `--ok` / `--ok-weak` | `#0b7d55` / `#e6f5ef` | `#34d399` / `#0e2a22` |
| `--warn` | `#9a5b00` | `#fbbf24` |
| `--danger` / `--danger-weak` | `#c62f2f` / `#fdeced` | `#fb7185` / `#2c1218` |
| `--head-mix` | 7% | 12% |

`--head-mix` is how much of a place's hue tints the head of its card
(`head-tint`: `color-mix(in srgb, var(--cat) var(--head-mix), var(--surface))`).

Semantic colour is separate from the accent and never used decoratively.
`node scripts/check-contrast.mjs` measures every text, icon and edge pair in both
themes over these tokens (text minimum 4.69 light and 4.87 dark; icons and edges
3.02 and 3.37).

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

Map chrome: `--pin-stroke` (`#fbfcff` / `#0c0f14`) is the pin and cluster rim;
`--pin-ico` (the same) is the glyph, which flips dark in dark mode
because the fills there are light.

---

## Typography

**Archivo** (variable, loaded from `@fontsource-variable/archivo` at 5.3.0, no
network font request) as the single family. A signage grotesque with the
compression and x-height to hold at 12px, and with real Romanian diacritics
(ă â î ș ț) rather than fallback glyphs. Chosen over Geist and Inter, both of
which are overused enough to read as a default.

`--font-mono` is a **system stack** (`ui-monospace, SFMono-Regular, Menlo,
Consolas`) — no webfont — and appears only on identifiers.

**Six sizes, each with a line height**: 12/16 (`text-meta`), 13/18
(`text-ui`), 14/20 (`text-body`), 16/24 (`text-field`), 22/28 (`text-place`),
28/34 (`text-hero`). The older role names (`text-caption`, `text-control`,
`text-lead` and the rest) remain for the screens the board did not draw, and each
now holds the nearest of the six.

| Role | Size | Weight | Where |
|---|---|---|---|
| Page title | 28 (`text-hero`), −0.015em | 600 | What's on, archive, settings, about, admin |
| Place title | 22 (`text-place`), −0.015em | 600 | The column and the sheet |
| Body, event titles | 14 | 400 / 600 | `body`, rows |
| Phone inputs, phone event titles | 16 | 400 / 600 | Search, event rows |
| Label column, secondary lines | 13 | 500 | Facts, addresses, event meta |
| Counts, group captions, hints | 12 | 400–600 | Counts, source lines, tab labels |

`.tnum` (`font-variant-numeric: tabular-nums`) on every column of digits: result
counts, event times, date tiles, cluster and pin badges.

---

## Shape, elevation, motion

**Radii** cap at 12px. `--radius-xs` 4 · `sm` 6 · `md` 8 · `lg` 10 · `xl` 12 ·
full 999px **reserved for filter chips, the timing lens and badges**.

**Elevation by role** — a chip, a panel and a pin must not share a shadow:

| Token | Role |
|---|---|
| `--sh-1` | The band, the attribution pill |
| `--sh-2` | Controls on the map, the raised What's on card |
| `--sh-3` | The place column and the bottom sheet |
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

**Button** — `primary` (accent fill, accent edge), `secondary` (surface + 1px
`--outline` edge), `ghost`, `danger`. Heights 32 / 40 / 48 (`sm` / `md` / `lg`),
radius 8. One primary action per surface; secondary carries an edge rather than
a fill so a row of actions does not read as three equal choices.

**Chip** — the filter primitive, and the only pill. 32px tall on a desktop, 44
on a phone. The category's own glyph in its hue, then the label; chosen, it
fills with the accent and the check replaces the glyph.

**Segmented** — the timing lens: a 10px-radius box on `--surface-2` with an
accent segment. Mutually exclusive options, so the shape says "pick one". The
phone's compact lens is one chip (`Anytime ▾`) opening a menu of three radio
items, because the lens is kept on the device.

**SearchInput** — 40px (44 on a phone), 1px `--outline` edge, no shadow; the
focus ring is the 2px accent outline.

**CategoryBadge** — hue glyph + written label on a plain surface with a 40%
hue edge (`hue-edge`), `rounded-lg`. Not a pill: it states what a place *is*.

**Tab bar** — four labelled tabs (Map, What's on, Archive, About the data) in the
page's flow on a phone, 56px, under the sheet and never hidden by it. The current
tab is accent-coloured; the top nav underlines the current section.

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

**Desktop** — a top bar, then the **docked band** (`--surface`, `--sh-1`):
row one holds the search (360px), the timing lens and, from 900 to 1239px, the
count and Draw an area; row two holds the chips (the six commonest, then `+5`)
and, from 1240px, the count and Draw an area. The map fills the rest. A place
opens as a **column docked on the left**, 400px wide and inset 12px, with a
`--line-strong` edge and `--sh-3`; the map's box ends where the column does, so
the selected pin is never covered. Zoom and Centre on me sit bottom-right, the
attribution bottom-left in a readable pill. The place card's head is tinted with
the place's hue; its facts are a 76px label column and a value column with inset
dividers, the source and node id on one line, hours on two. What's on reuses the
band (lens first) and lists in a raised card with day groups on `--surface-2`
strips.

**Mobile (up to 899px)** — a genuinely different composition, not a reflow. Row
one is the search and a `Categories` button carrying the active count; row two
is one sideways row: the compact lens chip, the count beside it, then the
chips. Categories opens a sheet with all eleven chips, Draw an area, Clear
filters and Done, over the tab bar. The place sheet rests at the height of its
head, actions and first fact (measured, about 240px), leaving at least 380px of
map at 390 x 844; the grab bar is a button (`Expand the place details`,
`Collapse`) and a swipe up reaches the full snap (82% of the viewport). A 44px
+/- pair sits above Centre on me. What's on gives the lens its own row.

---

## Map integration (Leaflet)

- **One stacking context**: `.leaflet-container { z-index: 0 }`. Leaflet stacks
  its own panes and controls from 200 to 1000; containing them means app chrome
  (400+) sits cleanly above without fighting each layer. Setting z-index on
  `.leaflet-control-container` does nothing — it is statically positioned.
- **`MapContainer` applies `className` only at creation.** Anything reactive
  must go on a wrapper element.
- **Attribution is a licence obligation.** Bottom-left, no leaf prefix, a
  32px pill on `--surface` with a `--line-strong` edge (a 44px "Map sources" pill
  that opens it on a phone), and lifted above whichever height the mobile sheet
  rests at (`--sheet-h`, set by the sheet). No state ships tiles
  unattributed.
- **Basemap**: CARTO Positron / Dark Matter behind `VITE_CARTO_API_KEY`.
  The build and its checks run on the fallback: without a key, CARTO's endpoints return a watermark tile, so the app falls back
  to OpenStreetMap raster tiles filtered toward the same quiet register
  (`.map-fallback`, with a dark-mode inversion) and swaps the attribution to
  match. **Known open item:** in dark mode the fallback tiles carry a warm cast
  against cool chrome. A CARTO key resolves it.

---

## Accessibility

WCAG AA. Category meaning never rests on colour. `--fg-faint` clears 4.5:1 in
both themes, measured at the rendered pixel. Focus moves into the place column on
open and Escape closes it. A Playwright spec tabs through every screen and asserts
a 2px ring on each stop, one asserts no running animation under
`prefers-reduced-motion`, and one asserts no sideways overflow at 390px. Markers are keyboard-reachable with real `alt` text;
clusters carry a title. `prefers-reduced-motion` is honoured. The app is fully
usable with geolocation denied — location is a button, never a dependency.

---

## Review status

Finish review: three rounds, disposition **ship**; eleven material fixes and
three regressions scored resolved. That verdict covers what was captured —
**login and register, the loading/empty/error states, and every dark-theme
surface except the desktop place panel were never captured and so were never
reviewed.** Not a clearance of the whole surface.
