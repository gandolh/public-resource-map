# TP-04 — UI/UX Audit

Setup: [../../playwright/README.md](../../playwright/README.md).
Design reference: [../../corpus/wiki/design.md](../wiki/design.md) and
[../../corpus/wiki/stitch-screens.md](../wiki/stitch-screens.md).

## Goal

Audit all three routes for design fidelity (vs. CivicMap tokens and Stitch screens),
typography, empty/loading states, responsive layout, and basic accessibility.

## Cases

### Design Fidelity

1. **Token colors** — primary, surface, on-surface, outline-variant all match the
   CivicMap palette (`primary: #1c6090`, `surface: #f9f9ff`, `background: #f9f9ff`).
   Screenshot the navbar, filter bar, and a detail drawer for visual comparison.

2. **Map pins** — resource pins are 32px circles with white 2px border and category
   color fill. Selected pin scales up. Compare to Stitch screen spec.

3. **Filter chips** — inactive chips: outlined, neutral. Active chips: `bg-primary`
   fill, white text, no border. Matches Stitch spec exactly.

4. **Event cards** — title uses `headline-md` weight, date/venue use `label-md`
   muted. Card has `rounded-xl`, shadow, 1px border. Hover lifts the card.

5. **Detail drawer** — desktop: 400px fixed right panel. Mobile: bottom sheet with
   drag handle. Category badge: colored dot + uppercase label. CTA button full-width.

6. **Navbar** — "CivicMap" wordmark in primary color. Active nav link has bottom
   border indicator. Theme toggle and profile menu visible.

### Typography

7. **Scale usage** — headings use `font-semibold` or `font-bold`. Body copy uses
   `text-base` / `text-sm`. No unlabeled unstyled text.

8. **Line heights** — body text is readable (not cramped). Generous spacing between
   sections.

### Dark mode

9. **Dark mode toggle** — clicking the theme toggle in the navbar switches to dark
   mode. Map tiles change to CartoDB Dark Matter. Surface colors invert to dark tones.
   All text remains legible (no white-on-white or black-on-black).

10. **Dark mode — events page** — event cards in dark mode use appropriate surface
    tones and don't lose border/contrast.

### Responsive layout

11. **Mobile (375px width)** — resize browser to 375px. Map page: filter bar
    collapses correctly, pins still visible, detail drawer becomes bottom sheet.
    Navbar shows mobile layout.

12. **Events page mobile** — grid drops to 1 column. Filter chips wrap correctly.
    "Upcoming Events" shows mobile heading size.

13. **Resource detail mobile** — 3-column layout collapses to 1 column. Hero image
    height reduces. Breadcrumb visible.

### Empty / loading states

14. **Events — empty state** — with geolocation at a location far from seeded data
    (or an impossible category), the events page shows a friendly empty message
    (not a blank grid or undefined count).

15. **Map — no location** — when geolocation is denied, the map defaults to the
    Bucharest center. No crash. Filter chips still function.

### Accessibility (basic)

16. **Keyboard navigation** — tab through the map page. Filter chips should be
    focusable and activatable with Enter/Space. Detail drawer should trap focus.

17. **Color contrast** — primary blue `#1c6090` on white `#f9f9ff` meets WCAG AA
    (contrast ≥ 4.5:1 for normal text). Category badge text on tinted background
    should also pass.

18. **Alt text / aria** — map pins should have aria-labels with the resource name.
    Images (if any) should have meaningful alt attributes.

## Pass criteria

- Visual design matches CivicMap token spec for colors, spacing, and components.
- Dark mode is consistent and readable across all three routes.
- Mobile layout doesn't overflow or break at 375px.
- Empty states exist and are friendly.
- Keyboard navigation reaches all interactive elements.
- No critical a11y failures (missing labels, keyboard traps without escape).
