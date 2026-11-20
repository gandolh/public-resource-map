fix

# public-resource-map (CivicMap): critique of B "The docked desk", full build

Read from today's shots, the build's renders, and my own headless measurements of the light twins (Chrome, `scratchpad/m.mjs`). The comps draw a flat street plan where the app draws tiles. Today's shots sit on busy CARTO/OSM tiles, so the build looks calmer than the app will. The areas below are geometry and compare fairly. The visual weight does not.

## First-screen density, today against the build

"Clear map" means map not covered by a floating card, panel, sheet or tab bar. Today at 360x800 was never shot and there is no dev server, so that column is derived from the 390 shot and DESIGN.md's 0.46 peek.

| Screen | Today | Build |
|---|---|---|
| 1280 map, map box / clear | 1280x748 / ~870k px (filter card 352x216 and lens float over it) | 1280x651 / 833k px (-4%) |
| 1280 place, clear map | 884x748 less the filter card and lens, ~574k px | 855x651, 557k px (-3%), never covers the pin |
| 1280 place, facts above the fold | 4 facts, event 1 whole, event 2 title | the same |
| 1280 filters visible | search, 6 named chips, +5, Draw, count, lens | the same, all in one band |
| 390 map, clear height | 648 px (lens row floats at 110-140) | 619 px (169-788), plus the "1 with events" pill over its top |
| 390 place, clear map | 315 px (sheet at 457, tab bar hidden) | 383 px (169-552), +22%, ruling 1 met |
| 390 place, facts in the peek | 3 whole (hours on one line, phone, website) plus the Source label | 1 (hours, two lines, its divider under the tab bar) |
| 390 categories readable | 0 on the map (behind the sliders icon), 3 named on What's on | 1 (`All`) on map and What's on, the rest past the edge |
| 390 What's on, events above the tab bar | 4 | 3 |
| 360x800 place | derived: ~290 px clear map, ~2 facts | the twin is fixed at 844 high, so at 800 the tab bar hangs 44 px off-screen. In a real 800 viewport with a 236 px peek the map is 339 px and the name wraps, so the Hours row is clipped (0 whole facts) |

Desktop holds today's density and stops covering the map. The phone trades two facts for 68 px of map, which ruling 1 asked for. The real loss on the phone is categories.

## Invented data on the board

- **Must go:** `9 places` and `1 with events` on the `map` screen, at 1280 and in the 390 hint and pill. The count is city-wide (today's place shot reads 1996, the fixture's exact București total). With Museums and Libraries chosen the seed gives 73 + 51 = **124 places**, and **2 with events**, because MNAR and Muzeul Național al Satului (category `museum`, `seed-data.ts` line 207) both carry events. The `9` is the number of pins the builder drew. Either keep the filter and print 124 / 2, with a sticky saying the drawn pins are a sample of the viewport, or draw the screen unfiltered (1996 / 4) like the place screen.
- **Label it:** the `map` screen is București at street zoom with a filter on. Today's `map` is Timișoara at city zoom with clusters, 454 places, 7 with events. The comp skips the busiest first screen the app has. Add a sticky that says so and point to the cluster specimen on the Direction sheet, or draw the city-zoom state.
- **May stay, stated:** the fifth event (Târgul meșterilor populari, seed line 208) and the dates 14 and 15 Nov (the seed's `SAT`/`SUN` offsets from Thursday 12 Nov 2026). Both check out. The whats-on sticky already says so. Add "as of 12 Nov 2026" because the seed dates move every day.

## The builder's departures

- **Place column at 400 px.** Justified. I set the twin's column to 368 px and the Source row grew from 40 to 60 px (it wraps). Ruling 3 made the narrowing conditional on the facts staying on one line, and they don't. Keep 400.
- **Band still two rows.** Justified, and it is a clash with ruling 3. One row needs about 1,650 px at 1280, so "one row shorter" is only possible by hiding categories behind `+N`, and that is the truncation the board forbids. The ruling's letter (counts and Draw on the chip row) leaves 620 px of row 1 empty right of the lens at 1280. At 1024 it causes a **third row** holding only the count and Draw an area (band 136 px). See issue 6.
- **Account not in the phone tab bar.** Accept. It is a 44 px person icon top-right, which is where Android's own apps put it, and ruling 2 fixed the four tabs. Today's `?` read as Help, so this is a gain.
- **Draw an area absent on the phone.** Not accepted as drawn. Today's phone reaches it from the expanded filter panel (`FilterBar.tsx`, `AreaControls` in the mobile block). The build says it lives in a Categories sheet that is not drawn. That makes it a capability the board can't show. Draw the sheet (see issue 4).

## Regressions against today

1. **What's on, 390: categories.** Today shows the lens on its own row, then `All`, Parks, Libraries, Clinics and part of Museums. The build puts the 240 px lens first in one scrolling row, so only `All` is readable. Ruling 1 protects map height and doesn't bind this page, which has no map. Give the lens its own row here again (segmented, 40 px) and the chips the full width below it.
2. **Phone map: zoom buttons gone.** Today's 390 map has `+` and `−` over the locate button. The build keeps only locate. Pinch is the only way to zoom out, and that fails WCAG 2.5.1 (single-pointer alternative). Put back a 44x88 zoom pair above locate, bottom-right, with 8 px between.
3. **Phone sheet: facts.** Today's peek shows hours, phone and website. The build shows hours only. Ruling 1 asked for this to buy map height, so I accept it at 390. At 360 it breaks (issue 2).
4. **What's on: a running exhibition dated in the past.** Today's list prints `until Dec 22` in the time slot. The build gives Brâncuși a `29 Oct` tile under the `Today` heading, which reads as "this happened on 29 Oct". For an event already running, show the group's day on the tile (`12 Nov`) and keep `until Dec 22` in the meta line. The place panel has the same tile, today's app included, so fix it in both places.
5. **Phone map: the events count lost its place.** Today keeps `1996 places` beside the lens as one status group. The build moves places into the search hint and floats `1 with events` alone at the top centre of the map. There it covers the Piața Română label and half of a library pin under the band's edge.

## Priority issues

1. **The phone chip row shows no category** (map, place and What's on, 390 and 360). The lens takes 240 of 366 px, so ruling 2's "categories one tap away" is met in the DOM and missed on screen. This is ruling 1 against ruling 2. Flag it to the controller. A fix that keeps both: turn the lens into one compact chip at the head of the row that shows its value (`Anytime` with a chevron, about 108 px) and opens a three-option Base UI Select. At 390, `All`, Parks and Libraries then read in full. Also label the filter control `Categories` with its count, as ruling 2 and both judges asked. It is a bare sliders icon now.
2. **The 360 peek clips the first fact.** The name wraps to two lines and the sheet stays a fixed 236 px, so the Hours row slides under the tab bar. Size the peek from its content (head, actions, the first fact row, 8 px), which comes to about 262 px at 360. Render the twins at a real 360x800 too. The comp is fixed at 844 high, so the tab bar falls off the bottom at 800.
3. **Invented counts on the map screen.** Replace `9 places · 1 with events` with seed-true numbers (124 / 2) or the unfiltered 1996 / 4. Details are above.
4. **Draw the phone Categories sheet.** Include all 11 categories as chips (the `+5` ones too), Draw an area, `Clear filters` and the active count. Until it is drawn, Draw an area has no phone entry on the board, and today has one.
5. **Put the phone zoom pair back** (regression 2).
6. **The band at 1024 runs to three rows.** At 1024 the count and Draw an area take a row of their own, 40 px of map for two items. They fit at the right end of row 1 (368 px free there, they need about 330). Row 1 = search, lens, count, Draw. Row 2 = chips only. That keeps the band at two rows down to 1024, and at 1280 it frees row 2 for three or four more named chips before `+N`. This goes against the letter of ruling 3, so the controller decides.
7. **What's on, 390: 3 events above the tab bar where today shows 4,** without truncating anything. `Tickets ↗` sits on its own line with 20 px above it. Move it to the right end of the `Source:` line (or under the pin button in the right column), and take the card's inner padding from 16 to 12. That frees about 40 px per ticketed event, enough to bring the fourth event back. Keep venues wrapping in full. That is better than today's ellipsis.

## Strengths to keep

- **The hued head on the place card.** The museum's purple runs from the selected pin into the card's head, and the name and actions read as one group above the facts. It holds in dark.
- **Islands are back, and they never cover the pin.** On desktop the band and the docked column sit on their own surfaces with a 12 px ground gutter and a line-strong edge, and the map stays one clear field. What's on is a raised card with day groups on surface-2 strips and a count on each group. That is visibly more structured than today's flat list.
- **Navigation is conventional.** `Map` is underlined on `/places/:id`, the phone has four labelled tabs, and `+5` is a real chip.
- **Dark is designed.** Surfaces get lighter as they rise (ground #090b0f, surface #1c212b) and keep their edges on the map, the accent eases to #6d9bff with dark ink, and the pins dim without going muddy.

## Heuristic scores (0-4)

1. Visibility of status: 3. Counts and the selected nav are visible. On the phone the events count floats off on its own and the chosen chips are off-screen.
2. Match with the real world: 3. A `29 Oct` tile under `Today` misreads.
3. User control: 3. Close, the grab-bar button and the clear-filter states are drawn.
4. Consistency: 3. The band carries across Map and What's on, and the lens is always first.
5. Error prevention: 3.
6. Recognition over recall: 2 on the phone (no category readable, Draw an area undrawn). 3 on desktop.
7. Flexibility and efficiency: 2. No phone zoom buttons and no phone draw path.
8. Aesthetic and minimal: 3. Clean surfaces, six type sizes. Row 1 of the band is half empty.
9. Error recovery: 3. Error, empty and zero-result states are drawn with actions.
10. Help: 3. About the data is a tab.
Total 28/40.

**Detector** (detect.mjs with parser modules, all seven twins): `cramped-padding` on `.pg` (the page wrapper), `.search` (the input pads itself) and `.wolist` (the day strips run edge to edge on purpose), all dismissed. `flat-type-hierarchy` on map (12/14/16) and place (1.8:1), dismissed, because an app screen with a 22 px title over 14 px rows is right. `gpt-thin-border-wide-shadow` on the place column (1 px edge + 32 px blur), advisory, kept on purpose because dark needs the edge. Direction sheet: `em-dash-overuse` (76, from the specimen tables and event titles), `clipped-overflow-container` on html/body, and `cramped-padding` on the toast and tab-bar specimens, all false positives for a specimen sheet.

Do not dilute while fixing: the docked column that never covers the selected pin, the hued head, and the islands on both themes. Get the phone's categories back on screen without shrinking the 380 px of map.
