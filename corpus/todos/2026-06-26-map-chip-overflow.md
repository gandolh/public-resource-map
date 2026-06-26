## Map filter chips clipped on mobile

On 375px the horizontal chip row in `/map` clips the last chip ("Community") at the
right edge. Users can't tell the row is scrollable — no fade mask or partial peek.

**Fix:** Add `overflow-x: auto` (already there via `[&::-webkit-scrollbar]:hidden`)
but add a right-side gradient fade overlay to signal more content, and ensure chips
have `flex-shrink-0` so they don't compress.

**File:** `ui/app/routes/map.tsx` — the chip row container div.

**Acceptance:** All 6 category chips reachable by scrolling at 375px; visible
affordance (fade or partial chip) that the row scrolls.
