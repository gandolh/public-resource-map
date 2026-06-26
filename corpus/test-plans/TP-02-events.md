# TP-02 — Events List Page

Setup: [../../playwright/README.md](../../playwright/README.md).
Mock geolocation to `{ lat: 40.7851, lng: -73.9683 }` (Central Park, NYC).

## Goal

Verify the events list renders seeded events, category filters work, the count is
accurate, and pagination behaves correctly.

## Cases

1. **Page loads** — navigating to `/events` renders the "Upcoming Events" heading and
   a grid of event cards. No blank or broken layout.

2. **Event count** — the subtitle below the heading shows the correct count (should
   be 8 for the default seeded data at NYC coords with default radius).

3. **Event cards** — each card shows: title, category badge, date/time, and venue
   address. No "[object Object]" or raw null leaking into the UI.

4. **Category filter — Concerts** — clicking the "Concerts" chip filters to 1 card
   ("City Jazz Festival"). Other cards disappear. Count updates.

5. **Category filter — All** — clicking the "All" chip restores the full listing.

6. **Category filter — empty state** — click a category that has no seeded events
   (e.g. "Theater" should show 1, "Sport" should show 1). Confirm the count matches
   and no crash.

7. **Pagination** — with 8 events and PAGE_SIZE=12, only 1 page of results exists.
   Pagination controls should not be shown (or prev/next should be disabled).

8. **Card navigation** — clicking an event card (if linked) navigates correctly.
   (If cards aren't yet linked to a detail route, confirm they at least don't throw.)

9. **Loading state** — on initial page load before the API responds, skeleton cards
   or a loading indicator should be visible (check the EventCardSkeleton component).

## Pass criteria

- Events grid renders with real seeded data.
- Category filter chips correctly narrow results and update the count.
- "All" chip restores full listing.
- No layout breaks, no raw data leaking into UI text.
- Loading state visible briefly on first load.
