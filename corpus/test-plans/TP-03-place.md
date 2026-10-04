# TP-03 — The place

## Goal

`/prm/places/:id` is the one place surface: on desktop a panel over the map,
on a phone a sheet. It shows the place, what is on there grouped by when, and
each event's tickets and source. It replaces the old `/resources/:id` page.

## Cases

1. **A cold deep link opens the place**, with its programme grouped (Today /
   Tomorrow / This weekend / Later), and each event's source credited with a
   link.
   e2e `place.spec › a cold deep link opens the place with its programme and
   sources`.
2. **A place in another city** switches the city picker to it.
   e2e `place.spec › a link to a place in another city switches the city`
   (`SEED.places.buArtMuseum`).
3. **Ticket links.** An event with a `buyUrl` shows a ticket link, and one
   without shows none. Seeded: Muzeul de Artă has both kinds. **Manual.**
4. **A place with nothing on** says so, and keeps its address, hours and
   website. **Manual**, on any park.
5. **An event venue** (not from OSM) opens like any other place: Piața
   Victoriei, `SEED.places.tmPiataVictoriei`. **Manual.**
6. **Not found.** `/prm/places/<unknown id>` shows a not-found state, not a
   crash. **Manual.**
7. **Follow star**, signed out: covered by TP-06.

## Pass criteria

- The e2e specs above are green.
- Manual cases 3 to 6 behave as described.
