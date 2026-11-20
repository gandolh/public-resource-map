# The board's notes: CivicMap

The estate redesign board is a private canvas. This file copies what its page for this app said beside the screens: the owner's asks, the decisions, the rules the design reopened, the open questions and the Floor. The owner's answers are in [README.md](../README.md#the-owners-decisions).

## Asks to the owner

- 1. Reopened: B moves three recorded layouts: the search leaves its floating card for a docked band, the place panel moves from the right to a left column, and on the phone a tab bar (Map, What's on, Archive, About the data) stays under the sheet. Is that on the table, or does the map keep today's floating arrangement? 2. The comps draw a quiet street plan; the real app draws CARTO Positron / Dark Matter tiles. Will the CARTO key be in place before the build, or should the build be judged on the filtered OpenStreetMap fallback, which runs warm in dark? 3. Approve The docked desk as CivicMap's direction? (beside `public-resource-map-direction`)

## Decisions

- The place card's head carries the place's own hue (A's signature): the museum's purple, at 7% light and 12% dark over the surface, runs from the pin into the head, so the name and its actions read as one group above the facts. The badge keeps a 40% hue edge on a plain surface (controller ruling 4, from direction A). (beside `public-resource-map-proposed-place-1280`)
- Facts read fast: a label column (13 px, sentence case, with its icon), inset dividers, and the source and node id on one line. That needs about 285 px of value width, which holds at a 400 px column but not at ruling 3's 368 px (240 to 250 px), so the column stays at 400; the gain on the 1280 map comes from trimming the gutters instead. Hours wrap to two lines at every width (they need about 400 px) (ruling 5). (beside `public-resource-map-proposed-place-1280`)
- Date tiles lead with the day number and put the month under it (29 / Oct, 12 / Nov), on a surface-2 tile with a hairline edge (ruling 5). (beside `public-resource-map-proposed-place-1280`)
- The category hue is always an icon plus a label: chips and event lines show the category's own glyph in its hue where today shows a dot (Hallmark gate 63 bans decorative dots). A chosen category chip fills with the accent and a check, like All [conv]. (beside `public-resource-map-proposed-map-1280`)
- Filters in use: Museums and Libraries are chosen, and the count is the seed's true figure for that filter, 124 places and 2 with events (73 museums + 51 libraries; MNAR and Muzeul Satului carry events). The drawn pins are a sample of the street-zoom viewport, not all 124. This screen is București at street zoom with a filter on; today's map screen is Timișoara at city zoom with clusters (454 places, 7 with events), which is not redrawn: the cluster specimen is on the direction sheet, with the research's warning that number clusters confuse people [S35] (label them, zoom in on tap). (beside `public-resource-map-proposed-map-1280`)
- The phone's Categories sheet is drawn: all 11 categories as chips (the five behind +5 included), Draw an area, Clear filters and Done, the active count in the header, and the tab bar hidden under it. The Categories button in the search row carries the count. Draw an area has no place in the phone band, so it lives here, as in today's expanded filter panel. (beside `public-resource-map-proposed-categories-390`)
- What's on reuses the docked band (time lens, category chips, count) so the desk feels the same off the map, and the list sits in a raised card with day groups on a surface-2 strip [conv]. As of 12 Nov 2026: the weekend dates (14 and 15 Nov) follow from the seed's Saturday and Sunday on Thursday 12 Nov, and the fifth event, Târgul meșterilor populari at Muzeul Satului, is from the seed (today's shot cuts off after four). A running exhibition shows the group's day on its tile (12 Nov) and keeps "until Dec 22" in the meta line, in the list and in the place panel. (beside `public-resource-map-proposed-whats-on-1280`)
- On the phone the lens has its own row here (no map to protect), with All, Parks, Libraries and Clinics readable below it; Tickets sits at the right end of the Source line and the card pads 12 px, so about 40 px per ticketed event come back. The tab bar sits at the end of the page here; in the app it is fixed and the list pads by its 56 px plus the gesture inset. The phone layout runs up to 899 px; the top bar drops the mark under 340 px. (beside `public-resource-map-proposed-whats-on-390`)
- The nav marks the current section at every width: the Map link carries an underline on desktop and on the place page, and the current tab is accent-coloured on the phone. The signed-out Account is a person icon, not a question mark (ruling 6). (beside `public-resource-map-proposed-place-1280`)
- Archivo and the blue stay today's (Archivo 400, 500, 600 on Google Fonts); only the shell, the neutrals and the shadows change. --fg moves off #0d1117 (GitHub's canvas to the digit) to #131922, and the shadows tint from it. (beside `public-resource-map-direction`)
- The sheet's peek shows the name, the actions and the first fact, with the grab bar as a button (a keyboard alternative to dragging), and the +/- zoom pair is back above Centre on me, 44 px each, so zooming needs no pinch [conv]. (beside `public-resource-map-proposed-place-390`)
- Band at 1024: the count and Draw an area move to the right end of row 1 so the band stays two rows (the chips alone fill row 2); at 1280 they stay on the chip row. The 400 px column and the two-row band stay (controller ruling 6). (beside `public-resource-map-proposed-place-1280`)

## Reopened rules

- Recorded (decisions-ui.md, "The direction is the category convention"): "floating search, pill filter chips, teardrop pins, a docked side panel on desktop, a draggable bottom sheet on mobile", a permanent exit that future work must not rescue with a novel visual world. Proposed: only the search leaves its floating card for a docked band (with the lens, chips, count and Draw an area); chips, pins, the docked panel and the sheet stay, and no new visual world is added. (beside `public-resource-map-direction`)
- Recorded (ui/DESIGN.md, Layout): "full-bleed map. Search + filter card top-left (352px), timing lens bottom-centre, place panel docked right (384px, inset 12px)". Proposed: the band above the map holds search, lens and filters; the place panel docks left at 400 px, inset 12 px, and the map runs full-bleed to the right and bottom edges; the controls stay bottom-right, the attribution bottom-left of the map. (beside `public-resource-map-proposed-place-1280`)
- Recorded (ui/DESIGN.md, Mobile): "a two-snap draggable sheet (peek 0.46 / full 0.82 of the viewport), and a bottom tab bar that hides while the sheet is up", with the lens and a live count below the search. Proposed: the tab bar stays under the sheet, the sheet rests as a peek sized from its content (head, actions, first fact), the lens becomes a compact Anytime chip in the sideways chip row and the count sits beside it; the full snap is not drawn. (beside `public-resource-map-proposed-place-390`)
- Recorded (ui/DESIGN.md rule 7): "Small tracked-uppercase labels use `.label-cap` in the UI face." Proposed: none; labels are sentence case in the body face, because tracked capitals fail Hallmark's gate. (beside `public-resource-map-direction`)

## Open questions

- The judges split on the phone: B's tab bar and one-tap chips against A's bigger map. This blend takes B's navigation and A's map: at 390 x 844 with the sheet at rest the map is 384 px (B's sketch 269). Round 2 sizes the peek from its content, so the first fact is whole at 390 (sheet 239 px) and at 360 x 800 (sheet 267 px, map 312 px, the name wraps). The lens is one compact Anytime chip that opens a three-option select, which brings All, Parks and part of Libraries back on screen; the count sits beside it. Keep the blend? (beside `public-resource-map-proposed-place-390`)

## The Floor

- Contrast is scripted over 42 pairs: text min 4.61 light and 4.87 dark, icons and focus rings min 3.02 and 3.37; surface against ground 1.17 light and 1.22 dark, and every surface on the map carries a line-strong edge (1.44 and 1.93). The 11 category hues are checked on the tinted place head, as icons, as pin glyphs and as pins on the map (worst: icon on surface 4.9 light, 5.33 dark). No page overflow and no control spill at 1280, 1024, 768, 390 and 360 in either theme; phone targets are 44 to 56 px. At 1280 x 800 the map field is 856 x 651 (sketch 844 x 623). Facts above the fold: 1 whole (hours) at 390 x 844 and at 360 x 800, with the tab bar on screen in both. Sloplint --scope app --render: 0 FAIL, 0 REFLEX on all seven Proposed twins (24b and 72 waived with reasons; the accent-ink and shadow-under-hairline warnings stay). The direction sheet draws empty, loading and error states for the place, the map and What's on. (beside `public-resource-map-direction`)

## Other notes

- The street plan is a stand-in drawn for the comp. The real app draws map tiles there (CARTO Positron / Dark Matter, or the filtered OpenStreetMap fallback), so pins and clusters sit on a busier ground than shown.
- Numbers keep the app's format as the shots show it (1996 places, Apr-Sep 11:00-19:00). Hallmark gate 19 rejects the em dash in copy, so the event titles are set with the figure dash U+2012, which looks the same; the app's strings keep their dash. Typography stays at six sizes: 12, 13, 14, 16, 22 and 28.
- Handoff: manifests/public-resource-map.tokens.css and public-resource-map.tokens-map.md carry the tokens in the app's own names. No numbered callouts on the comps: the app fills the frame edge to edge, so there is no margin to put them in.

## Contrast, as measured

| Pair | Light | Dark | Needs |
|---|---|---|---|
| fg on surface (panel, band, rows) | 17.33 | 14.11 | 4.5 |
| fg on bg (page title on What's on) | 14.88 | 17.23 | 4.5 |
| fg-muted on surface (address, meta) | 6.46 | 6.87 | 4.5 |
| fg-muted on bg (What's on subtitle) | 5.55 | 8.39 | 4.5 |
| fg-muted on surface-2 (nav hover, lens idle) | 5.91 | 6.06 | 4.5 |
| fg-muted on surface-3 (lens hover) | 5.25 | 5.26 | 4.5 |
| fg on surface-3 (lens hover) | 14.07 | 10.8 | 4.5 |
| fg-faint on surface (fact labels, group heads) | 5.46 | 5.52 | 4.5 |
| fg-faint on surface-2 (date tile month, placeholder) | 5 | 4.87 | 4.5 |
| fg-faint on bg (small text on the page) | 4.69 | 6.74 | 4.5 |
| accent on surface (links, Tickets, current tab) | 5.37 | 5.98 | 4.5 |
| accent on bg (link on the page) | 4.61 | 7.3 | 4.5 |
| accent on accent-weak (hover wash) | 4.75 | 5.17 | 4.5 |
| fg-on-accent on accent (All, Anytime, Directions, EN) | 5.33 | 7.11 | 4.5 |
| fg-on-accent on accent-hover (Directions hover) | 6.7 | 8.61 | 4.5 |
| danger on surface (error text, with a label) | 5.36 | 5.99 | 4.5 |
| danger on surface-2 (error in a field) | 4.9 | 5.28 | 4.5 |
| map-label on map-land | 5.59 | 6.09 | 4.5 |
| map-label on map-park | 5.16 | 5.45 | 4.5 |
| map-label on map-water | 4.73 | 5.65 | 4.5 |
| fg on map-land (attribution pill text sits on surface; reference) | 15.45 | 15.57 | 4.5 |
| outline on surface (search, Copy link, star, Draw an area) | 3.52 | 4.32 | 3 |
| outline on surface-2 (sheet grab bar) | 3.22 | 3.81 | 3 |
| outline on bg (field edge on the page) | 3.02 | 5.27 | 3 |
| accent on bg (focus ring on the page) | 4.61 | 7.3 | 3 |
| accent on surface (focus ring on a surface) | 5.37 | 5.98 | 3 |
| accent on surface-2 (focus ring in the lens) | 4.91 | 5.27 | 3 |
| accent on map-land (selected pin ring, focus on the map) | 4.79 | 6.59 | 3 |
| fg-muted on surface (icons in rows and controls) | 6.46 | 6.87 | 3 |
| surface on bg (band, column, top bar against the ground; needs 1.09) | 1.17 | 1.22 | 1.09 |
| surface on map-land (controls and attribution on the map; needs 1.09, edge adds) | 1.12 | 1.1 | 1.09 |
| surface-2 on surface (date tile, lens track; needs 1.09) | 1.09 | 1.13 | 1.09 |
| line-strong on bg (the map field's edge; needs 1.3) | 1.39 | 2.13 | 1.3 |
| line-strong on map-land (control edge on the map; needs 1.3) | 1.44 | 1.93 | 1.3 |
| line-strong on surface (chip and Close edge; needs 1.3) | 1.62 | 1.75 | 1.3 |
| line on surface (row rules; needs 1.09) | 1.33 | 1.33 | 1.09 |
| fg on the hued head, worst of 11 hues | 15.41 | 11.01 | 4.5 |
| fg-muted on the hued head (address), worst of 11 hues | 5.75 | 5.36 | 4.5 |
| hue icon on surface (badge, event dot), worst of 11 hues | 4.9 | 5.33 | 3 |
| outline on the hued head (grab bar, Copy link edge), worst of 11 hues | 3.13 | 3.37 | 3 |
| pin glyph on its hue fill, worst of 11 hues | 4.87 | 6.34 | 3 |
| hue on map-land (the pin against the map), worst of 11 hues | 4.37 | 5.88 | 3 |

## The runner-up

**Runner-up: A, The standard, finished (sketch only, not built)**

Note: how this direction was picked. Two directions were sketched (A evolve today, B the docked desk) and two judges compared every pair against today, in both orders, at 1280 light and 390 dark. 11 of 12 verdicts agreed: B won 3, A 2, today 0; the two judges split on the phone between B's tab bar and chips and A's larger map. The build takes B's navigation with A's map height and A's tinted place head. Say so here if you'd rather keep today's floating panels over a full-bleed map (A).

## The artboards on the board

- Direction · The docked desk
- Place · 1280 · light · today
- Place · 390 · light · today
- Map, filters in use · 1280 · light · today
- Map, filters in use · 390 · light · today
- What's on · 1280 · light · today
- What's on · 390 · light · today
- Place · 1280 · light · proposed
- Place · 390 · dark · proposed
- Map, filters in use · 1280 · light · proposed
- Map, filters in use · 390 · dark · proposed
- What's on · 1280 · light · proposed
- What's on · 390 · dark · proposed
- Categories sheet · 390 · dark · proposed
- Runner-up A, The standard, finished · light 1280 (sketch)
- Runner-up A, The standard, finished · dark 390 (sketch)
