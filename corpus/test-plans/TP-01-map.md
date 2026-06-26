# TP-01 — Map Page

Setup: [../../playwright/README.md](../../playwright/README.md).
Mock geolocation to `{ lat: 40.7851, lng: -73.9683 }` (Central Park, NYC).

## Goal

Verify the map page renders correctly with seeded data: tiles load, resource pins
appear, filter chips function, radius slider responds, and the detail drawer opens.

## Cases

1. **Page loads** — navigating to `/map` renders a full-height Leaflet map with CartoDB
   tiles. No blank tile grid. The 64px top navbar is visible above the map.

2. **Filter overlay present** — the search input and filter bar are visible, overlaid
   top-left on the map. Search input has placeholder "Search CivicMap".

3. **Resource pins visible** — with geolocation mocked to Central Park and default
   5 km radius, at least 3–5 colored resource pins appear on the map.

4. **Category filter chip — activate** — clicking a category chip (e.g. "Libraries")
   toggles it active (filled background). The map should update to show only
   that category's pins.

5. **Category filter chip — deactivate** — clicking the active chip again deactivates
   it (returns to outlined state). All-category pins reappear.

6. **Radius slider** — dragging the radius slider changes the displayed distance
   label. Moving it inward reduces visible pins; outward may reveal more.

7. **Pin click → detail drawer opens** — clicking a resource pin opens the detail
   drawer (slides in from the right on desktop; bottom sheet on mobile). The drawer
   shows: category badge, resource name, address, and a "Get Directions" button.

8. **Detail drawer close** — clicking the × button or clicking outside the drawer
   closes it. The drawer disappears.

9. **User location dot** — if geolocation is granted, a pulsing blue dot appears at
   the mocked location.

10. **Navbar links** — clicking "Events" in the navbar navigates to `/events`.

## Pass criteria

- Map tiles render (not grey boxes).
- At least one resource pin visible with mocked NYC location.
- Filter chip toggle changes visual state and visible pins.
- Detail drawer opens on pin click and shows real data from the seed.
- No JS console errors from the app (benign Leaflet/HMR noise is acceptable).
