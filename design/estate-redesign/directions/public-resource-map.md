# public-resource-map (CivicMap): two directions

Written 2026-11-12 by the art director. Repo: public-resource-map, brief 06. Both directions stay inside the recorded decisions (`corpus/wiki/decisions-ui.md`, `ui/DESIGN.md`, `ui/PRODUCT.md`). The map is home. The category convention is locked: pill filter chips, teardrop pins, a docked panel on desktop, a draggable sheet on a phone, and no new visual world on top of it. The craft bar is Citymapper and Linear. The 11 `--cat-*` hues stay as they are (they are information, tuned for white glyphs), always with an icon and a label. The accent owns "selected". Pills only ever mean filter. Radii cap at 12. Romanian is the default language with an English switch, and Light / Dark / System opens in light.

Registry: Archivo and the blue accent are today's, so the registry allows them, even though atrium and newspapper set Archivo and atrium, newspapper and comercial-website each hold a blue. Keep Archivo at normal width, because newspapper's signature is its `wdth` 125 cut. Keep the blue at hue ~225 with high chroma (`#2a5bef`), clear of the 210° azures and atrium's slate navy. Taken elsewhere, never use: Literata, Public Sans, Rethink Sans, Bricolage Grotesque, Atkinson Hyperlegible Next, Hanken Grotesk, Newsreader, Sofia Sans, Schibsted Grotesk, Spline Sans Mono, Azeret Mono; teal, clay, amber, moss, patina green, neutral ink.

## 1. Today's strengths (keep all of them)

1. The map is the field and fills the screen. The chrome sits on it as a few raised, edged islands with a shadow per role (filters, lens, controls, the place panel), never as one flat sheet.
2. The place panel reads top to bottom: a category badge (hue, icon, label), the name, the address, one solid `Directions` beside a bordered `Copy link` and the star. Then the facts as icon rows split by 1px lines, then `What's on here` with its count and date-tiled events.
3. When a place is open the other pins dim, and the chosen pin grows with an accent ring and an event-count chip. You can always find the place you are reading.
4. One blue owns selection everywhere: `All`, `Anytime`, `EN`, `Directions`. Category hue never stands alone.
5. The live count under the filters (`1996 places`, `4 with events`) keeps status in view.
6. The phone is its own layout, not a reflow. Search, the lens and the count stay in view over the map, the place comes up in a two-snap sheet, the bottom tabs carry labels, and the attribution stays visible.

Faults both directions fix:
- `--fg` light is `#0d1117`, GitHub's dark canvas to the digit, and the shadows use `rgba(13, 17, 23, …)`. Move both off it.
- Tracked capitals (`HOURS`, `PHONE`, `TODAY`, `.label-cap`) fail Hallmark Floor 9. Use sentence case, the body face, one step smaller.
- Middle-dot joins (`1996 places · 4 with events`, `© OpenStreetMap contributors · node/…`, `until Dec 22 · Exhibition`) fail Floor 10. Give each item its own span with a gap, or its own line.
- On `/places/:id` no top-bar link is current (`Navbar.tsx` marks `Map` only on `/`). Mark `Map` there too.
- A signed-out account shows `?`, which reads as Help. Use a person icon.
- Dark islands on dark tiles: `#14171d` on the basemap is about 1.0, and the filter card nearly merges. Light `surface` on `bg` is 1.04.
- The `+5` chip is plain text with a target under 32 px.
- The panel uses about 17 text sizes. Five or six will do.

## 2. The main screen

The map with a place open, its shell around it: route `/places/<id>?city=bucuresti`, in `board/shots/public-resource-map/`.
- **1280:** `light-1280-place.png`, dark `dark-1280-place.png`.
- **390:** `light-390-place.png`, dark `dark-390-place.png`. The sheet rests at its peek and the tab bar is hidden. The peek cuts off at the `Source` label; draw the sheet's content to that point, not further.

The bare map (`light-1280-map.png`, `light-390-map.png`) is context only.

## 3. The content fixture

English, as in the shots. Labels come from `ui/app/lib/i18n.tsx`, not from the rendered capitals.
- **Top bar.** Mark and `CivicMap`. City picker `București` with a chevron (`Change city`). Links `Map` (current), `What's on`, `Archive`, `About the data`. Right side: `RO` `EN` (EN chosen), `Switch theme`, `Account`.
- **Filters.** Search `Search for a place`. Chips `All` (on), `Parks`, `Libraries`, `Museums`, `Town halls`, `Education`, `Clinics`, `+5`. `Draw an area`. Count `1996 places`, `4 with events`. At 390 the chips sit behind `Categories` in today's layout.
- **Lens.** `Today`, `Weekend`, `Anytime` (on).
- **Map controls.** `Zoom in`, `Zoom out`, `Centre on me`. Attribution: `About the data` | `© OpenStreetMap contributors (ODbL 1.0)`, on an opaque surface; at 390 the `Map sources` button.
- **Panel / sheet.** `Close panel`. Badge `Museum` (museum hue, landmark icon). `Muzeul Național de Artă al României`. `Calea Victoriei 49-53, București`. `Directions`, `Copy link`, star (`Follow Muzeul Național de Artă al României`). Rows: `Hours` `Apr-Sep 11:00-19:00; Oct-Mar 10:00-18:00; Mo,Tu closed`; `Phone` `021/313.30.30;021/314.81.19`; `Website` `www.mnar.arts.ro`; `Source` `© OpenStreetMap contributors` and `node/2634652837` (system mono). `What's on here`, `2 events`, group `Today`:
  1. tile `Oct` `29`, `Brâncuși și contemporanii săi — expoziție temporară`, `until Dec 22`, `Exhibition` (cultural-centre hue), `Source: MNAR`, `Tickets`, bell `Remind me of …`;
  2. tile `Nov` `12`, `Grigorescu — lucrări din depozit`, `18:00`, `Exhibition`, `Source: MNAR`, `Tickets`, bell.
- **The map (the one planned departure from "same counts").** There are no tiles: no network, and a screenshot under the chrome would hide the design. Both directions draw the same flat street plan in map-role tokens. It is a stand-in for CARTO Positron / Dark Matter, not an illustration. Draw blocks, about 14 street lines with Calea Victoriei as the main north-south road, the Cișmigiu park with its lake to the south-west, and six labels: `Calea Victoriei`, `Strada Știrbei Vodă`, `Piața Română`, `Palatul Regal`, `Cișmigiu`, `Universitate`. Pins: the selected museum pin (38 px, accent ring, chip `2`) beside Palatul Regal, plus 30 dimmed 30 px teardrops: 6 museum, 7 education, 5 theater, 4 community centre, 3 park, 2 library, 2 town hall, 1 clinic. Two of them carry a `1` chip. Map tokens (light / dark): map-land `#eef0f2` / `#15181d`, map-road `#ffffff` / `#262b33`, map-park `#dcebdc` / `#17251d`, map-water `#cfe0ee` / `#13202d`, map-label `#56606c` / `#8e98a6` (5.2 on park, 4.7 on water in light; 5.5 and 5.7 in dark).
- **States strip.** No events: `Nothing scheduled here` / `The place stays on the map — events are sparse and only appear once an organiser publishes them.` Error: `Couldn't load this` / `Check your connection and try again.` / `Try again`. Zero results: `No place passes these filters` / `Remove a filter to see more.` / `Clear filters`. Loading: static skeleton rows, `Loading`.

## 4. Directions

### A. The standard, finished (Evolve today)
- **Idea:** today's islands over the map, brought to Citymapper's finish. The ink is real, the labels are calm, the edges hold in dark, and the panel's head carries the place's own hue.
- **Skeleton:** today's.
  - **1280.** A 52 px top bar on `surface` with a `line` foot. The filter card top-left is 352 px, and this time it is one island: the search sits inside the card as its first row, not floating above it. Chips wrap in two rows, `+5` becomes a 32 px chip, `Draw an area` sits under them, and the count closes the card on its own line under a `line` rule. The lens is bottom-centre; zoom and centre are bottom-right and move left when the panel opens. The panel is docked right, 384 px, inset 12, radius 12, `sh-3`, with a 1px `line-strong` edge in dark.
  - **The panel head** (badge, name, address, actions) is a block tinted with the category hue (`color-mix` 6% light, 10% dark, over `surface`). A full-width `line` closes it, then the fact rows and the events on plain `surface`. Date tiles are `surface-2` with a `line` edge.
  - **390.** Today's composition: top bar, search with `Categories`, lens with the count, the sheet at 46 / 82 %, and the tab bar hidden while the sheet is up. Sheet targets are 48 px.
- **Type:** Archivo 400/500/600, `family=Archivo:wght@400;500;600`. Six sizes: 12/16 labels, counts, tile month (tabular); 13/18 addresses and event meta; 14/20 UI, chips, rows; 16/24 inputs and phone body; 20/26 panel title at 600, -0.015em; 28/34 page titles.
- **Palette** (light / dark), today's token names:
  - Ground and surfaces: bg `#eff2f6` / `#0c0f14`; surface `#ffffff` / `#1a1f27`; surface-2 `#edf0f5` / `#232933`; surface-3 `#e2e7ee` / `#2c333e`.
  - Lines: line `#dce1e8` / `#2e3540`; line-strong `#c5ccd6` / `#3d4553`.
  - Text: fg `#131922` / `#edf0f4`; fg-muted `#545e6b` / `#a1aab7`; fg-faint `#5f6977` / `#8e98a6`.
  - Accent: accent `#2a5bef` / `#6d9bff`; accent-hover `#1f4bd8` / `#85adff`; on-accent `#ffffff` / `#0c0f14`; accent-weak `#e9effe` / `#1d2b4d` (with an accent-line `#c3d2fb` / `#2f4474` edge); semantic and `--cat-*` as today. Shadows tint from `fg`, not from `#0d1117`.
  - Pre-checked (light / dark): fg on surface 17.7 / 14.5; fg-faint on surface 5.6 / 5.7; fg-faint on surface-2 4.9 / 5.0; accent on surface 5.5 / 6.1; accent on accent-weak 4.8 / 5.2; accent-weak on surface 1.15 / 1.19; on-accent on accent 5.5 / 7.1; surface on bg 1.12 / 1.16; surface on map-land 1.14 / 1.08, so dark islands need the line-strong edge (1.84 on map-land). Re-run `contrast.mjs`, and table every text pair on the hued head for all 11 hues: the badge's own tint nearly vanishes on it, so the badge keeps its 34% hue edge.
- **Signature:** the hued head. The museum's purple runs from its pin into the panel's head, under its badge, so the panel visibly belongs to the pin.
- **Reference:** `linear.app`, for the surface ladder edged by three hairline weights. Nothing of its palette or type.
- **Reopens:** `ui/DESIGN.md` rule 7 (`.label-cap`, tracked uppercase), required by the Floor.

### B. The docked desk
- **Idea:** every filter in one docked band across the top of the map, the place in a docked column at the left, and the map as one clear field to the right.
- **Skeleton:**
  - **1280.** The 52 px top bar. Under it a two-row filter band on `surface`, docked full width, with a `line` foot and `sh-1` (about 100 px). Row 1: search (360 px), the lens, and the count at the right end. Row 2: the chips (`All` to `Clinics`, then `+5`) and `Draw an area`. One line will not hold them all at 1280 (about 1,650 px). The map fills the rest. The place column docks left, 400 px, inset 12 from the band and the edges, radius 12, `sh-3`, holding today's panel content with `Close panel` at its top right. Controls sit bottom-right, and the attribution bottom-left of the map, right of the column. The `ground` shows as a 12 px gutter around the column.
  - **390.** Top bar as today. Search full width, then one sideways-scrolling chip row (`All`, `Parks`, …), with no `Categories` button. A tab bar stays visible (`Map` current). With no place open, the lens and the count float as one 48 px strip just above the tab bar. With a place open, the sheet docks above the tab bar at 40 / 78 % of the viewport, its handle row carries the lens and the count, and at least 220 px of map stays clear between the chip row and the sheet so the selected pin shows. Content pads by the bar plus the gesture inset.
- **Type:** the same face and six sizes as A, except the place title is 22/28 at 600 in place of A's 20/26.
- **Palette** (light / dark): as A, with a deeper ground so the band and column stand off it: ground (`bg`) `#e8ecf1` / `#090b0f`; surface `#ffffff` / `#1c212b`; surface-2 `#f0f3f7` / `#252b36`; line `#dde2e9` / `#2f3642`; line-strong `#c3cad5` / `#3f4856`. Pre-checked: surface on ground 1.19 / 1.22; fg-faint on ground 4.7; fg-muted on ground 5.6 / 8.4; accent on ground 4.6; fg-faint on surface-2 5.0 / 4.9; fg-faint on ground (dark) 6.7; dark fg on surface 14.1; dark accent on surface 6.0; dark line-strong on map-land 1.93. Re-run `contrast.mjs`.
- **Signature:** the filter band. Search, time and count on top, categories and area under them, all in one docked strip above the map, so what you asked and how many places answer read together.
- **Reference:** `airbnb`, for its inline search-filter band above the results. Nothing of its palette, radii or pills.
- **Reopens** (flag each on the board):
  - `decisions-ui.md` lists "floating search" in the locked convention. B docks the search into the band.
  - `ui/DESIGN.md` Layout: "Search + filter card top-left (352px), timing lens bottom-centre, place panel docked right (384px, inset 12px)". B moves all three.
  - `ui/DESIGN.md` Mobile: "a bottom tab bar that hides while the sheet is up", and the filter button. B keeps the bar, shows the chips and moves the lens into the sheet's handle row.
  - Rule 7 (`.label-cap`), as A.

## 5. Registry lines

| public-resource-map (A) | The standard, finished | Archivo (today's) | Archivo (today's) | blue `#2a5bef` (today's) | full-bleed map; one filter card top-left with search inside; lens bottom-centre; 384 px panel docked right with a category-hued head; phone sheet over the map, tabs hidden under it |
| public-resource-map (B) | The docked desk | Archivo (today's) | Archivo (today's) | blue `#2a5bef` (today's) | top bar over a two-row docked filter band (search, lens, count; chips and draw); a 400 px place column docked left; map to the right; phone chip row, sheet above a tab bar that stays |

## 6. Questions for the owner (ask sticky)

1. B docks the search into a band, moves the place panel to the left and keeps the phone's tab bar under the sheet. Each of those moves recorded layout. Is that on the table, or does the map keep today's floating arrangement?
2. Approve this direction?
3. The comps draw a quiet Positron-style plan. Will the CARTO key be in place before the build, or should the build be judged on the filtered OpenStreetMap fallback, which runs warm in dark?
