# Task 06: A redesign with taste-skill, on the estate board

**Depends on:**

- In public-resource-map: [brief 04](04-base-ui-by-the-conventions.md), which puts the one stylesheet in layers, adds the Base UI wrappers and the Light / Dark / System switch. A redesign is then mostly a new token set and layout.
- In the owner's skills library:
  - brief 24, *Re-pin the taste suite* (taste-skill 2.5);
  - the estate redesign board: one artifact with a page per app, owned by the skills library.
- The owner's answer of 2026-11-10 (Q39): no bake-off; taste-skill 2.5 redesigns every web UI, and the owner approves each app on the board before any code changes.

**Runs before:** nothing. **Runs after:** 01 to 05, the redesign last. Brief 05 is server-only and does not block it.

**Before you start:** run `brief-board guide` ([corpus/CLAUDE.md](../../CLAUDE.md)).

## Context

CivicMap shows what a Romanian city's public places offer (parks, libraries, clinics, museums) and what is on at them, on one map. Two audiences use it: residents looking for a place or an event, and an admin who reviews ingested events.

### The screens (read 2026-11-10, `ui/app/routes.ts`)

| Screen | Route | File |
|---|---|---|
| Map, home (the place panel on desktop, the place sheet on a phone) | `/` and `/places/:id` | `ui/app/routes/map.tsx`, `ui/app/routes/place.tsx`, `ui/app/components/place/PlacePanel.tsx`, `ui/app/components/place/PlaceSheet.tsx` |
| What's on | `/whats-on` | `ui/app/routes/whats-on.tsx` |
| Archive (mine and city tabs) | `/archive` | `ui/app/routes/archive.tsx` |
| About the data | `/about-data` | `ui/app/routes/about-data.tsx` |
| Log in, register, settings | `/login`, `/register`, `/settings` | `ui/app/routes/login.tsx`, `register.tsx`, `settings.tsx` |
| Admin: review queue and sources | `/admin`, `/admin/sources` | `ui/app/routes/admin/review.tsx`, `sources.tsx`, `AdminLayout.tsx` |
| The shell: top bar, bottom tab bar on a phone, menus | every page | `ui/app/components/Navbar.tsx`, `ui/app/components/Layout.tsx` |
| Error and 404 | | `ui/app/root.tsx` |

### What the design docs fix today

- [ui/DESIGN.md](../../../ui/DESIGN.md) records the shipped design system, and says the code in `ui/app/app.css` wins where they differ. [ui/PRODUCT.md](../../../ui/PRODUCT.md) is the product truth.
- [wiki/decisions-ui.md](../../wiki/decisions-ui.md) locks the visual direction of 2026-09-04 (the category convention at a Citymapper and Linear craft bar: one accent, a 1 px border as the default separator, tight radii, cool-biased neutrals, category hue always paired with an icon and a label), the interface language (Romanian by default, an English switch) and the basemap constraint (Leaflet with CARTO or OpenStreetMap tiles). [wiki/design.md](../../wiki/design.md) points at both.
- The theme switch is the owner's call of 2026-11-10 (Q18): Light / Dark / System, light on a first visit, `data-theme` through `@custom-variant`. Brief 04 builds it.
- The category palette carries meaning: 11 hues (`--cat-*` in `ui/app/app.css`), each tuned for white-icon contrast in both themes.

The redesign stays inside these decisions unless the owner reopens one on the board.

## Owner decisions

Answered 2026-11-10: Q39 (taste-skill 2.5, approval on the board first). Default: the proposal keeps the map as home, the category convention and the two languages. Anything that moves one of those is flagged on the board as a reopened decision.

## Files you OWN

- `ui/app/app.css` (the tokens) and the screens listed above, one commit each.
- `ui/DESIGN.md`, recorded from the shipped result.
- Corpus: [wiki/decisions-ui.md](../../wiki/decisions-ui.md) (the visual direction, if it changes), [wiki/status.md](../../wiki/status.md), [log.md](../../log.md).

## Files you must NOT touch

- `backend/` and `shared/`.
- The Ward library in `ui/vendor/`.
- The copy's meaning: both languages keep their wording unless the board approves a change. No invented facts or numbers.

## What to do

1. **Today.** Take Playwright screenshots of every screen above at 1280 and 390 px, in light and dark, kept out of git. Include the place sheet at peek and full, the open menus, and the admin panel.
2. **Propose.** With taste-skill 2.5, make a proposal per screen, inside the recorded decisions. Check each against the Floor: contrast, a visible focus ring, a reduced-motion path, no invented facts, no broken phone layout.
3. **Board.** Put the proposals on this app's page of the estate board, beside today's screenshots at both widths.
4. **Approval.** The owner approves on the board. Nothing below starts before that, and the approval is recorded in `log.md` with its date.
5. **Build.** First as a token change in `ui/app/app.css` (colours, radii, shadows, type, spacing, both themes), then one screen per commit. Keep Base UI's wrappers and the theme switch working.

## Acceptance

- [ ] The owner's approval is on the board and recorded in `log.md` with the date.
- [ ] Contrast: every text and icon pair in both themes clears 4.5:1 (3:1 for large text and UI parts), measured with a script over the built tokens and listed in the outcome note.
- [ ] A Playwright test tabs through each screen and asserts a visible focus ring on every stop.
- [ ] A Playwright test with `reducedMotion: "reduce"` asserts no running animation or transition on each screen.
- [ ] A Playwright test at 390 px asserts `document.documentElement.scrollWidth <= window.innerWidth` on each screen.
- [ ] Every figure and place name shown comes from the data or the copy files; the outcome note lists none invented.
- [ ] `npx playwright test`, including the theme spec from brief 04, passes in light, dark and system.
- [ ] `npm run check` passes, and `bash corpus/lint.sh` ends clean.

## Interplay

- Brief 04 owns the layers, the wrappers and the theme switch; this brief changes the tokens and layout on top. The switch must survive in both themes, and the map's tiles must still follow it (CARTO when keyed, the filtered OpenStreetMap fallback otherwise).
- [Brief 01](01-a-source-registry-and-shareable-map-links.md) puts a source credit on the map and the About page. The redesign keeps that credit legible and in place.
- Brief 03's formatter and lint run on every redesign commit.
