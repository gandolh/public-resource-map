# public-resource-map (CivicMap): judge result (2026-11-12)

Two opus judges, j2 reversed; 11 of 12 verdicts agree.

| Pair | 1280 light | 390 dark |
|---|---|---|
| T vs A | A | A |
| B vs T | B | B |
| A vs B | B | **split** (j1 B, j2 A) |

Agreed wins: **B 3, A 2, T 0.** Winner B "The docked desk"; runner-up A "The standard, finished". The phone split is the real tension: B gives the phone a bottom tab bar and one-tap category chips (both judges want them), but its stacked bands squeeze the map to a strip; A keeps about 420 px of map but hides categories behind an icon and shows no route to What's on, Archive or About the data. The rulings below take B's navigation and A's map.

## The controller's rulings for the full build of B

1. **Phone map height:** with the sheet at rest, at least 380 px of map shows at 390x844 (measure it). Get it by taking the time switch and the count off the sheet: the time switch joins the top band as the first item of the scrolling chip row, and the count goes into the search field's hint ("1 996 places", the app's own format). The sheet rests lower (a peek with the place name, actions and the first fact).
2. **Keep on the phone:** the labelled bottom tab bar (Map, What's on, Archive, About the data) and the category chips one tap away. The `Categories` control shows the number of active categories.
3. **1280 map area:** trim the grey gutter around the map card, put the counts and Draw an area on the chip row so the band is one row shorter, and narrow the place column (400 → 368 px) if the facts still fit unwrapped.
4. **Borrow A's signature:** the place card's title block gets a head band tinted with the place's category hue (A's tokens; contrast checked for all 11 hues), so name and actions read as a group above the facts.
5. **Facts read fast:** a label column (13 px, sentence case, never tracked capitals), inset dividers, source and node id on one line, hours on one line where they fit. Event date tiles lead with the day number.
6. **Small things both judges named:** the current section marked in the nav at every width; the map attribution in a readable pill, clear of controls; `+5` is a chip like its siblings.
7. **Ask stickies:** the directions file's questions (B moves the search, the place panel and the phone tab bar, which are recorded layout; the CARTO key), plus this split.
