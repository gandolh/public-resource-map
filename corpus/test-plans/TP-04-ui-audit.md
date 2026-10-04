# TP-04 — UI audit

Reference: [`ui/DESIGN.md`](../../ui/DESIGN.md), which is recorded from the
shipped UI; the code in `ui/app/app.css` wins where they disagree. Product
truth: [`ui/PRODUCT.md`](../../ui/PRODUCT.md).

## Goal

A by-eye and keyboard pass over every public route (map, place, what's on,
archive, about the data) and the admin shell, in both themes, on desktop and
at phone width. Everything in this plan is **manual**; it is the one plan the
e2e suite does not stand in for.

## Cases

### The load-bearing rules (DESIGN.md)

1. **One accent for "selected".** Chips, the timing lens, the language toggle
   and the selected pin's ring use the accent, and nothing else invents a
   second selection colour.
2. **Pills only filter.** Counts, category badges and disclosures are
   `rounded-md`, not pills.
3. **Category is never colour alone.** Every pin and badge carries an icon and
   a written label. A cluster's event marker is a counted chip.
4. **A 1px border separates; shadow is only for what floats** (the search box,
   the panel, the sheet, popovers).

### Themes

5. **Dark and light are both designed.** The basemap switches with the theme,
   and text, chips, pins and the panel stay legible in both. System follows
   the OS.

### Responsive (375 × 740)

6. **The map**: the filter bar fits without clipping (chips scroll
   sideways), the place opens as a sheet that drags between its snaps, and the
   tab bar reaches map, what's on and about.
7. **What's on, archive, about**: one column, no horizontal page scroll.
8. **Admin** is desktop-first, but readable at 375 without a broken layout.

### States

9. **Empty, loading, error.** Each list has a skeleton while loading, a
   written empty state, and an error state with Retry (stop the API to see
   it).

### Accessibility (basic)

10. **Keyboard.**
    - Tab reaches the search, every chip, the lens, the city picker, the pins
      and the panel's controls.
    - Enter opens a pin, and Escape closes the panel and dialogs.
    - Focus is visible throughout.
    - The pin path is under e2e (TP-01 case 10).
11. **Names.**
    - Pins, clusters, the star, the bell and the icon buttons have accessible
      names.
    - Repeated buttons say what they act on (the review drawer's "Use <place>").
    - Archive tabs are a `tablist` with `aria-selected`.
12. **Contrast.** `--fg-faint` placeholders and labels clear 4.5:1 in both
    themes (DESIGN.md records 4.72 and 6.12).

### Attribution (brief 09)

13. **Present wherever data is shown.**
    - The map credits "© OpenStreetMap contributors (ODbL)" and CARTO, and
      links About the data.
    - Every event row and place event names its source.
    - `/about-data` states the licences, says that events are samples, and
      gives the takedown contact once `VITE_DATA_CONTACT` is set.
    - The map and source credits are also under e2e (TP-01 case 10, TP-02
      case 1).

## Pass criteria

- No rule in cases 1 to 4 broken on any route.
- Both themes legible.
- No overflow at 375.
- Every list has its three states.
- Keyboard reaches everything interactive.
- Attribution present on every data surface.
