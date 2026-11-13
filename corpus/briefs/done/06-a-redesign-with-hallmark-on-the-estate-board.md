# Task 06: A redesign with Hallmark, on the estate board

**Depends on:**

- In public-resource-map: [brief 04](../done/04-base-ui-by-the-conventions.md), which puts the one stylesheet in layers, adds the Base UI wrappers and the Light / Dark / System switch. A redesign is then mostly a new token set and layout.
- In the owner's skills library:
  - brief 24, which vendors Hallmark as the design skill and adopts taste-skill 2.5's ideas (palettes and type dealt by trade, its copy layer);
  - the estate redesign board: one artifact with a page per app, owned by the skills library.
- The owner's answer of 2026-11-10 (Q39): no bake-off; Hallmark redesigns every web UI, keeping what is useful from taste-skill 2.5, and the owner approves each app on the board before any code changes.

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

Answered 2026-11-10: Q39 (Hallmark, with taste-skill 2.5's useful parts; approval on the board first). Default: the proposal keeps the map as home, the category convention and the two languages. Anything that moves one of those is flagged on the board as a reopened decision.

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
2. **Propose.** With Hallmark (and taste-skill 2.5's trade palettes and copy layer where they help), make a proposal per screen, inside the recorded decisions. Check each against the Floor: contrast, a visible focus ring, a reduced-motion path, no invented facts, no broken phone layout.
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
- [Brief 01](../done/01-a-source-registry-and-shareable-map-links.md) puts a source credit on the map and the About page. The redesign keeps that credit legible and in place.
- Brief 03's formatter and lint run on every redesign commit.

## Outcome

Built 2026-11-13 as "The docked desk", approved on the estate redesign board (steps 1 to 4 were done there). Ten commits, from the approval entry in [log.md](../../log.md) to `ui/DESIGN.md`. Judged on the filtered OpenStreetMap basemap (no CARTO key assumed; the CARTO path is untouched). Deploy: `node cli.ts public-resource-map deploy`.

**What shipped.** The tokens in `ui/app/app.css`, both themes, with `--outline`, `--head-mix`, `text-field`, `text-place` and the line heights (the board's `map-*` tokens are not added: the fallback's tile filter uses no colours); the six sizes 12, 13, 14, 16, 22, 28 (older size names fold onto the nearest); Archivo from `@fontsource-variable/archivo` 5.3.0, the Google Fonts links removed; the phone layout up to 899px (`--breakpoint-md`). Screens: the shell and a four-tab bar in the page's flow; the docked band; the map's controls and attribution pill; the left place column with a tinted head and a label-column facts list; the content-sized sheet with a grab-bar button; What's on in a raised card of day groups; the Categories sheet.

**Contrast** (`node scripts/check-contrast.mjs`, 101 pairs per theme over `app.css`, including all 11 hues on the tinted head): text minimum 4.69 light and 4.87 dark; icons, glyphs, control edges and the focus ring minimum 3.02 light and 3.37 dark.

**Rulings measured** (specs `e2e/place.spec.ts`): at 390 x 844 the sheet at rest leaves at least 380px of map; the first fact is whole with the tab bar on screen at 390 x 844 and 360 x 800.

**Checks.** typecheck, ESLint, Prettier, dependency-cruiser, check-base-ui, check-structure and 316 Vitest tests pass. `npx playwright test` passes in light (78), dark and system (75 each; the theme spec skips in a forced theme and runs in the light run). New specs: `e2e/floor.spec.ts` (a 2px focus ring on every tab stop, no running animation under reduced motion, no overflow at 390, on 11 screens) and `e2e/shots.spec.ts` (screenshots when `SHOTS_DIR` is set). Not run clean: knip, which fails before this work on 27 backend and older exports; and the signed-in bell spec, which fails on the pre-redesign UI too (the seeded notification count is date-dependent).

**Specs changed to the approved layout** (intent kept): `map.spec` (the count is two spans now), `place.spec` (the sheet's rest height and swipe by the new snaps, the grab-bar button, pins above the sheet), `draw-to-filter.spec` (the first events count is the band's, group strips carry their own), `theme.spec` (dark `theme-color` `#090b0f`; skipped in a forced theme). `fixtures.ts` forces a theme with `PRM_E2E_THEME`.

**New accessible names** (both languages in `lib/i18n.tsx`): `filters.titleCount` "Categories, {n} active" / "Categorii, {n} active"; `filters.moreLabel` "{n} more categories" / "Încă {n} categorii"; `lens.chip` "When: {lens}" / "Când: {lens}"; `place.expand` "Expand the place details" / "Extinde detaliile locului"; `place.collapse` "Collapse" / "Restrânge". The Categories sheet reuses `area.done` for Done and `admin.close` for its X.

**Departures from the brief and the sheet.**
- The compact lens chip opens a menu of three radio items, not a Select: the lens is kept on the device, so the base-ui skill's rule 16 makes it a radio choice.
- The place column's `head` and the badge edge are CSS utilities (`head-tint`, `hue-edge` in `app.css`): check-base-ui rule 6 bans arbitrary colours in classes.
- The browser clock was not frozen at 12 Nov: the seed dates events from the run day, and the lens is applied on the server, so a frozen clock would only move the groups. Compared by structure.
- A signed-in phone top bar drops the brand mark under 420px, so the bell and the account icon fit; the Map tab leads home.
- The grab bar sits in a drag strip across the top of the sheet; a drag that starts on the button itself is a press.

**Differences from the comps** (`test` render of each twin against the build, the map region left out): map 1280 4.4 to 4.6%, map 390 11.3 to 11.8%, place 1280 6.7 to 6.8%, place 390 11.6 to 11.8%, What's on 1280 5.5%, What's on 390 15.7 to 16.1%, Categories 390 30 to 35%. What is left: the live tiles and pin sizes (not drawn into the app, by the sheet), the app's category glyphs and strings (`Sport`, the app's lasso and moon icons), pin and cluster shading, the theme icon, the date groups (the seed's dates move: today and tomorrow for the comps' Today and This weekend), the Categories sheet's scrim and its larger header and footer buttons, and Today's "Tickets" row alignment. No invented facts or numbers: every figure and name comes from the data or the copy files.

**Undrawn screens restyled** with the tokens and the direction's patterns, no new layout: Archive (mine and city), About the data, Log in, Register, Settings, the admin review queue and sources, the open menus (account, city, theme, the phone lens), Error and 404, the sheet at full snap, the city-zoom cluster view and the zero, loading and error states.

**Ambiguous cases.** A place with no hours, phone or website puts the Source row first, and the sheet's rest height measures it. An event with no ticket link keeps the existing "No ticket link" statement at the right end of the Source line.
