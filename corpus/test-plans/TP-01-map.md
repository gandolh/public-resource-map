# TP-01 — The map

Seed: `db:seed` (a frozen OSM sync of both cities + synthetic events). The
visitor stands in Piața Victoriei, Timișoara (`45.7537, 21.2257`).

## Goal

The map is home. A pin is a place, coloured by its category and badged with its
count of upcoming events. A click opens the place, and the city picker switches
between Timișoara and București. All of it works without geolocation.

## Cases

Each case names the test that covers it: **e2e** `npm run test:e2e`, **api**
`npm test`, or **manual**.

1. **Opens on Timișoara.** `/prm/` renders the map, the city picker reads
   Timișoara, and there are clustered pins and a "N places" count.
   e2e `map.spec › opens on Timișoara with its places on the map`.
2. **Pins are places.** Each pin's colour is its place category. A place with
   upcoming events wears a count badge, and clusters sum their children.
   **Manual**, at street zoom near Piața Unirii.
3. **Category chips and the timing lens narrow the same count.** A chip, then
   Today / Weekend / Anytime, change the count and the pins together.
   e2e `map.spec › a category chip and the timing lens narrow the same count`.
4. **The lens says what it hides.** A banner states the lens, and Show all
   brings everything back.
   e2e `filters.spec › the timing lens says what it hides, …`.
5. **Zero results** offer each active filter back as its own removable chip.
   e2e `filters.spec › zero results offers each filter back …`.
6. **A pin click opens the place** (a panel on desktop, a sheet on a phone),
   and the other pins dim.
   e2e `filters.spec › opening a place dims the others`; TP-03 for the panel.
7. **The city picker** switches to București: the map recentres and the count
   changes. Switching back restores Timișoara. **Manual.**
8. **Without geolocation** (permission denied) the map still opens on the
   chosen city with its pins, and "locate me" explains itself. **Manual.**
9. **Draw to filter.** A freehand loop, or a polygon by clicks, narrows the
   pins to the area. The area carries over to what's on, and a city change
   clears it with a notice.
   e2e `draw-to-filter.spec` (2 specs).
10. **Keyboard and screen readers.**
    - A pin is named for its place and what is on there ("Muzeul de Artă · 3
      events"), and a cluster for its count.
    - Enter or Space on a focused pin opens the place, and on a cluster it
      zooms in. Escape closes the place.
    - e2e `map.spec › pins and clusters are named …`, `› Enter on a focused pin
      opens its place, …`.
11. **Attribution.** "© OpenStreetMap contributors" and CARTO are credited,
    with a link to About the data. On a phone they fold behind an "i".
    e2e `map.spec › the attribution credits …`,
    `filters.spec › on a phone › the attribution folds …`.

## Pass criteria

- Every e2e spec named above is green.
- Manual cases 2, 7 and 8 behave as described.
- No app errors in the console (Leaflet and HMR noise is fine).
