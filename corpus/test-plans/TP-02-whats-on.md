# TP-02 — What's on

## Goal

The citywide index of upcoming events. It shares the map's filters, and every
row leads back to its place. (It replaces the old standalone `/events` grid.)

## Cases

1. **Lists the city's upcoming events.** `/prm/whats-on` is headed with the
   city, shows "N events", and names each row's source.
   e2e `whats-on.spec › lists what's on, each event naming its source`.
2. **A row opens its place** on the map.
   e2e `whats-on.spec › a row opens its place on the map`.
3. **Same filters as the map.** A category chip or the lens set on the map is
   still set here, and the reverse. **Manual.**
4. **A drawn area carries over.**
   e2e `draw-to-filter.spec › a polygon carries over to what's on, …`.
5. **Running events stay listed.** The seeded Brâncuși exhibition (opened two
   weeks ago, closing in about forty days) appears in București.
   api `whats-on.api.test`, `in-progress.api.test`; **manual** check in the
   UI.
6. **The way to the past.** The footer's "Past events" opens `/archive`.
   e2e `archive.spec › the desktop nav and what's on both lead to the archive`.
7. **States.** A city or lens with nothing on shows the empty state, not a
   blank page. **Manual.**

## Pass criteria

- The e2e specs above are green.
- Manual cases 3, 5 and 7 behave as described.
