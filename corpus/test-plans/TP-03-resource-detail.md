# TP-03 — Resource Detail Page

Setup: [../../playwright/README.md](../../playwright/README.md).

## Goal

Verify the resource detail page fetches and displays a seeded resource correctly,
handles not-found gracefully, and renders all content sections.

## Cases

1. **Happy path — community center** — navigate to `/resources/<northside-id>`.
   Page loads with: category badge, resource name, address, description, and
   "Get Directions" button. (Get the ID from `GET /api/resources?lat=40.7965&lng=-73.9638&radiusKm=1`.)

2. **Hero section** — the hero gradient renders without a real image (the seed has
   no imageUrl). The gradient placeholder looks intentional, not broken.

3. **Description card** — the "About" section shows the seeded description text.

4. **Map embed** — a Leaflet mini-map renders inside the detail page showing the
   resource location. Tiles load correctly.

5. **Hours card** — if the resource has `openingHours`, the hours table renders
   with day labels and times. No raw JSON string visible.

6. **Contact card** — phone and website fields render as links if present.

7. **Breadcrumb** — the breadcrumb shows "Map > {Resource Name}" and the Map link
   navigates back to `/map`.

8. **Not found** — navigate to `/resources/nonexistent-id`. The page shows a
   friendly not-found state (no crash, no blank screen).

9. **Loading skeleton** — briefly after navigation, a loading skeleton is visible
   before the data arrives. (May be fast in local dev; check the component.)

## Pass criteria

- Resource data renders correctly from the seeded database.
- Hours JSON is parsed and displayed as a table/list (not raw `{"Mon":"…"}`).
- Not-found shows a user-friendly message.
- Breadcrumb navigation works.
- No uncaught JS errors.
