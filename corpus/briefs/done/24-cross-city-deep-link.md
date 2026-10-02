# Brief 24 — A shared place link adopts the place's city

> Written 2026-09-27 from the [improvements audit](../../todos/2026-09-27-improvements-audit.md) (#7). Independent of 18–23. Found by reading the code, not by running it. **Reproduce in a browser first** (step 1).

## Context

`/places/:id` is the one place surface for a pin click *and* a cold shared link (a deliberate choice recorded in [brief 06](06-place-centric-ui.md)). The cold path assumes the place is in the city the visitor already has selected:

- The map's pins come from `usePlaces({ city: city.name, … })` for the **store** city (`ui/app/routes/map.tsx:136`). The store starts at `DEFAULT_CITY` (Timișoara) and is hydrated from localStorage by the Navbar (`ui/app/components/Navbar.tsx:154-163`).
- The place route loads the place by id and flies the map to it (`ui/app/routes/place.tsx:44-57`). It never looks at `place.city`.
- `PlaceMarkers` renders only the loaded `places` list, so a selected place outside that list gets no pin.

**Failure scenario.** Someone in Timișoara shares a București museum. A visitor whose city is Timișoara (the default, so any first-time visitor) opens the link. The panel shows the museum and the map flies to București, but the pins are Timișoara's: the map is empty, with not even the selected place's pin, and the city picker says Timișoara. Closing the panel leaves an empty București map labelled Timișoara. The reverse case also has a likely ordering race: `hydrateCity` switching the city makes `CityRecenter` (`map.tsx:44-50`) jump to the stored city's centre, away from the open place.

With two cities, roughly every shared link that crosses the city line hits this. Cold shared links are the path [brief 13](13-ui-interactions-and-features.md) singles out.

## Files you OWN
- `ui/app/stores/appStore.ts`
- `ui/app/routes/place.tsx`
- `ui/app/routes/map.tsx`: `CityRecenter` only
- `ui/app/components/Navbar.tsx`: the `hydrateCity` effect only

## Files you must NOT touch
- `ui/app/lib/cities.ts`: `cityByName` already maps `"București"` → the city.
- Backend: `Place.city` already carries the name.

## What to do
1. **Reproduce** with the dev stack and the browser tool. Open `/places/<id of a seeded București place>` in a fresh profile (empty localStorage), and screenshot the empty map and the Timișoara picker. Record the result in the log. If it does *not* reproduce, stop and write down why.
2. Add a store action, e.g. `adoptCity(city)`, that switches the city **without** clearing `selectedId`/`search` (unlike `setCity`) and persists it like `setCity`.
3. In the place route, once the place has loaded and `cityByName(place.city)` differs from the store city, call `adoptCity`. The pins then refetch for the right city.
4. Stop `CityRecenter` from yanking the view while a place is selected. The place route's `flyTo` owns the camera then; the city centre only matters when nothing is selected.
5. A deep link's city must beat the stored preference: `hydrateCity` must not override a city adopted from a deep link during the same load.

## Acceptance (in a browser)
- Fresh profile → `/places/<București id>` → picker says București, pins visible, the selected pin highlighted, map centred on the place.
- Close the panel → still București with its pins.
- Stored city București → `/places/<Timișoara id>` → ends on Timișoara, centred on the place, no jump back to București's centre.
- Normal pin clicks and the city picker behave as before.
- `npm run typecheck` green.

## Outcome (2026-10-03)

Reproduced as described, then fixed per steps 2–5: `adoptCity` in `appStore.ts`, adoption in `place.tsx`, and a selection guard in `CityRecenter`. Step 5 needed no Navbar change, because `adoptCity` persists and `hydrateCity` therefore reads back the adopted city. All four acceptance checks passed in a headless browser against a scratch seeded DB; see the log entry. Typecheck is clean.
