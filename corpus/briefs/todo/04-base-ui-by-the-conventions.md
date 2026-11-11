# Task 04: Base UI by the conventions

**Depends on:**

- In public-resource-map:
  - [brief 02](../done/02-base-ui-1-9-0.md), for the 1.9.0 pin;
  - [brief 03](03-the-house-style-harness.md), for the gate, the formatter, ESLint and `.claude/rules/ui.md`.
- In the owner's skills library:
  - brief 02, *A base-ui skill, styled with Tailwind*: rules 1-13, the references and `check-base-ui.mjs`;
  - brief 15, *Enforce the base-ui and code-structure skills in every repo*: the checker runs `--warn-only` until this brief is done.
- The owner's grilling of 2026-11-10 (see the decisions below). The owner's answers and the technical calls settle every question used here (Q15-Q17, Q40-Q44, Q57-Q62); each decision below says which.

**Runs before:** nothing in this repo needs it first. [Brief 05](05-the-server-in-the-code-structure.md) touches `backend/` only, so the two can run in either order but never at the same time (both change `package-lock.json` and the corpus status page).

**Before you start:** run `brief-board guide` ([corpus/CLAUDE.md](../../CLAUDE.md)).

**Update 2026-11-11:** brief 03 named the ESLint config `eslint.config.mjs` (not `.js`), left `no-unnecessary-type-assertion` off until `noUncheckedIndexedAccess` is on, and runs `check-base-ui --warn-only` with these counts: rule-3 3, rule-5 1, rule-9 2 (warnings), rule-11 1. `ui/app/app.css` stays out of Prettier (`*.css` is in `.prettierignore`) until it is split into layers.

## Context

The owner's call of 2026-11-09 is Base UI everywhere at 1.9.0, styled with Tailwind v4, with the base-ui skill's conventions enforced in each repo. This repo is ahead on both counts: it is on Tailwind 4.3.1 already (`ui/package.json`, `@tailwindcss/vite`), and it has a Base UI wrapper in `ui/app/components/ui/`. So there is **no Tailwind migration brief** here. What is left is:

1. the Base UI audit, rules 1-13, and the wrapper set;
2. the one stylesheet's leftovers: plain CSS that sits outside Tailwind's layers, Leaflet's included;
3. the theme switch, which the owner's call of 2026-11-10 changes.

### The owner's decisions of 2026-11-10 that land here

- **Dark mode, Q18: a switch everywhere, light by default.** Every app has a Light / Dark / System choice, stored per device, and a first visit shows the light theme rather than following the system. Tailwind's `dark:` variant keys off a `data-theme` attribute through `@custom-variant`, not `prefers-color-scheme`.
- **Visual parity, Q19: close enough.** The work is done when before and after screenshots at 1280 and 390 px show no visible change to layout or colour. A few pixels of drift in spacing or rounding need not be fixed or listed.
- **Form dialogs, Q58: stay open on an outside tap.** A dialog that holds a form sets `disablePointerDismissal`. This repo has one dialog and it holds no text field (see rule 12), so the rule adds nothing here yet; the new `Dialog` wrapper carries the prop for the next form.
- **Confirms, Q58: keep inline.** There is no confirm anywhere in this app, so nothing changes.
- **The phone menu, Q40: the swipeable `Drawer`.** This app has no phone navigation panel: its phone navigation is a bottom tab bar (`ui/app/components/Navbar.tsx:208-214`). Its one phone panel is the place sheet, which is a content sheet. Decision 3 covers it.

### What the app does in dark mode today (read 2026-11-10)

A Light / Dark / System choice already exists, but it is not the one the owner asked for.

- `ui/app/components/ThemeProvider.tsx` stores the choice in `localStorage` under `vite-ui-theme` and puts a `light` or `dark` **class** on `<html>`. The default is `"system"` (`ThemeProvider.tsx:26-31`), so a first visit follows the operating system. It resolves `system` once and does not listen for a change.
- `ui/app/components/ThemeToggle.tsx` is the control: a Base UI menu in the top bar with three items.
- `ui/app/app.css` swaps every token under `.dark` (line 82), and its `@custom-variant dark (&:is(.dark *))` (line 4) is unused: no component has a `dark:` utility (`grep -rn "dark:" ui/app --include=*.tsx` prints nothing). Dark mode is a token swap.
- **The map follows the theme; it is not light-only.** `ui/app/lib/map.ts:50-63` (`useIsDarkMode`) watches the `dark` class, and `ui/app/routes/map.tsx:327` and `ui/app/routes/admin/review.tsx:432` pick `DARK_TILES` or `LIGHT_TILES`.
  - With `VITE_CARTO_API_KEY` set, the tiles are CARTO `dark_all` or `light_all` (`ui/app/lib/map.ts:23-29`).
  - Without it (the case in `.env.example:38-40`, and the case until the owner gets a key), both themes use standard OpenStreetMap tiles, and `ui/app/app.css:288-294` filters them: a desaturating filter in light, and an invert-and-rotate filter under `.dark .map-fallback` in dark.
- `ui/app/root.tsx:59-60` sets two `theme-color` metas by `prefers-color-scheme`, so the phone's browser bar follows the operating system, not the switch.
- With `ssr: false` (`ui/react-router.config.ts`) the page is a static shell, so a returning dark user sees the light page until the provider's effect runs.

### The audit against rules 1-13 (2026-11-10)

Commands are `grep` over `ui/app`, run on 2026-11-10.

| Rule | Violations | Where |
|---|---|---|
| 1. Exact pin | 0 once brief 02 is done | |
| 2. Subpath imports | 0 | All 4 imports are subpaths: `/menu`, `/popover` ×2, `/dialog`. |
| 3. Base UI only under a `ui/` folder | **3** | `ui/app/components/FavoriteStar.tsx:1` and `ui/app/components/shell/Bell.tsx:2` (Popover), `ui/app/routes/admin/review.tsx:2` (Dialog). Only `ui/app/components/ui/DropdownMenu.tsx:1` is in a `ui/` folder. |
| 4. Tailwind on the parts, no class selector aimed at a part | 1 style slip | No CSS selector aims at a Base UI part. `ui/app/components/ui/DropdownMenu.tsx:21` writes `origin-[var(--transform-origin)]` where the skill uses `origin-(--transform-origin)`. `cn()` is `ui/app/lib/utils.ts`, not `src/lib/cn.ts`, and has no theme extension (rule 6's note below). |
| 5. One stylesheet, no inline `style` | **5 inline styles; the stylesheet is mostly unlayered** | One stylesheet exists, `ui/app/app.css` (461 lines), not `src/styles/index.css`: React Router's source folder is `app/`. 47 top-level rules sit outside any layer (below). Inline `style={}`: `ui/app/components/place/PlaceSheet.tsx:99` (computed geometry, allowed) and four that set a colour from data: `ui/app/components/ui/Chip.tsx:46`, `ui/app/components/ui/CategoryBadge.tsx:28`, `ui/app/components/place/EventList.tsx:87`, `ui/app/components/place/EventPlaceRow.tsx:47`. |
| 6. Semantic tokens only | **2** | No arbitrary colour (`-[#…]` finds nothing). Raw palette colours: `ui/app/components/ui/Button.tsx:26` (`text-white`) and `ui/app/routes/admin/review.tsx:359` (`bg-black/30`). Tokens for both exist or are one line away (`--fg-on-accent`, `--map-scrim`). 142 `text-[Npx]` sizes in 17 distinct values (Q62's "named type scale" question). |
| 7. Motion through state attributes, `motion-safe:` | **13 arbitrary values, 0 `motion-safe:`** | `duration-[100ms]`, `duration-[120ms]` ×6, `duration-[140ms]`, `ease-[cubic-bezier(.2,.8,.2,1)]` ×5, while `--ease` and `--dur-1..3` exist as tokens in `app.css`. One global `prefers-reduced-motion` rule (`app.css:454-461`) already stops every animation and transition, Leaflet's too, so `motion-safe:` on each utility would add nothing. See decision 7. |
| 8. Floating parts portalled, z-index from tokens | **20 raw z-indexes** | Every Base UI popup goes through its `Portal`. The z-indexes are raw numbers in 12 files (`z-[400]`, `[450]`, `[500]`, `[600]`, `[700]`, `[900]`, `[901]`, `[1000]`), with no token scale. The Leaflet comment (`app.css:268-273`) fixes the rule they follow: the map is one stacking context at 0 and app chrome is 400 and up. |
| 9. Triggers that wrap a component use `render` | 0 | `Menu.Trigger render={trigger}` (`DropdownMenu.tsx:16`) takes a `<button>` element. The menu items use `render={<Link />}` (`Navbar.tsx:85, 97, 98`). `Popover.Trigger` is styled directly. |
| 10. `Select` with `items` | 0 | No Base UI `Select` today; see rule 13 for the one native `<select>`. |
| 11. No native dialogs | **1** | `window.prompt` in `ui/app/components/place/PlaceDetail.tsx:68`, the fallback when the clipboard is blocked. |
| 12. Dialogs | **1 dialog, 3 gaps; 3 Escape listeners** | The one `Dialog` is the admin review panel (`ui/app/routes/admin/review.tsx:357-513`). It is controlled and has a `Title` (line 365). `onOpenChange` (line 357) ignores `details`, so there is **no Escape guard** and **no `initialFocus`**. It holds no text field (the two `<input>`s at lines 197 and 264 are checkboxes in the table, outside it), so `disablePointerDismissal` isn't needed. Three hand-written `window` Escape listeners close their panel without checking `event.defaultPrevented`: `ui/app/components/place/PlaceSheet.tsx:61-66`, `ui/app/components/place/PlacePanel.tsx:30-35` and `ui/app/components/map/AreaDraw.tsx:240-245`. Whether a Base UI popover's Esc reaches them is unconfirmed: step 7 tests it. |
| 13. Base UI over hand-built widgets | **9** | See below. |

**Rule 13's nine**, with what the decisions keep native left out:

1. **The place sheet**, `ui/app/components/place/PlaceSheet.tsx` (131 lines): a hand-built `role="dialog"` bottom sheet with its own pointer drag, two snap heights (peek and full), and its own Escape listener. See decision 3.
2. **The notice toast**, `ui/app/components/shell/NoticeToast.tsx` (36 lines): a timer, a live region and a tap to dismiss. It becomes Base UI `Toast`.
3. **The archive tabs**, `ui/app/routes/archive.tsx:64-97`: hand-built `role="tablist"`, `role="tab"` and `role="tabpanel"`, with no arrow keys. They become `Tabs`.
4. **The segmented control**, `ui/app/components/ui/Segmented.tsx:30-60` (used by `ui/app/routes/whats-on.tsx:63` and `ui/app/components/map/AreaDraw.tsx:257`): `role="radiogroup"` and `role="radio"` on plain buttons, one Tab stop each. It becomes `RadioGroup` (decision 4).
5. **The language switch**, `ui/app/components/shell/LangToggle.tsx:14-38`: two `aria-pressed` buttons where exactly one is always on. It uses the new `Segmented`.
6. **The filter chips**, `ui/app/components/ui/Chip.tsx:27`: `aria-pressed` buttons, several on at once. They become Base UI `Toggle`.
7. **Three native checkboxes**: `ui/app/routes/admin/sources.tsx:167` (a source's "enabled"), `ui/app/routes/admin/review.tsx:197` (select all) and `:264` (select one). They become `Checkbox`.
8. **The city `<select>`**, `ui/app/routes/admin/sources.tsx:238`, in the add-a-source form. It becomes `Select` with `items` and `name`, so the form still submits it.
9. **The share fallback**, `PlaceDetail.tsx:68` (rule 11): a `Popover` that shows the link in a read-only field, selected, so a visitor can copy it by hand.

**Considered and left:**

- `ui/app/components/place/PlacePanel.tsx`, the desktop side panel: a non-modal `<aside>` beside the map. Base UI has no equivalent that is not a dialog.
- The map's pins and clusters, and the draw-to-filter polygon: Leaflet's own DOM.
- The icon buttons' `title` tooltips (`FavoriteStar.tsx:53, 70`, and the marker `title`s in `ui/app/components/map/PlaceMarkers.tsx:129, 141`): a Base UI `Tooltip` has no hover on the owner's main phone, which is Android. Default: not now (decision 6).
- `ui/app/components/ui/Button.tsx` on Base UI's `Button`: optional, not now.
- Text, search and URL inputs (`ui/app/components/ui/SearchInput.tsx`, `ui/app/components/auth/fields.tsx`, the admin forms): native, as rule 13 says.

### The stylesheet's layers (read 2026-11-10)

`ui/app/app.css` is Tailwind's one stylesheet, and most of it sits outside Tailwind's cascade layers. `ui/app/app.css:1-2` read:

```
@import "tailwindcss";
@import "leaflet/dist/leaflet.css";
```

Measured with `postcss.parse` over the file (`r.each` over top-level nodes): 47 top-level **rules** outside any `@layer`, plus one `@layer base` block (lines 193-215), one `@theme inline`, two `@keyframes` and two `@media` blocks. The file's own comment (lines 188-192) explains why `html` and `body` are in `@layer base`: unlayered CSS beats layered CSS whatever the specificity.

What sits unlayered:

- **Leaflet's stylesheet** (`@import "leaflet/dist/leaflet.css"`, no `layer()`). It is unlayered vendor CSS, so it beats every Tailwind layer, including `utilities`. That has not mattered yet, because no utility targets a Leaflet element, but it is why the file's own Leaflet overrides (lines 259-340) need 17 `!important`s to win against it (lines 298-324). `!important` is the repo's way of beating its own vendor CSS.
- **The Leaflet overrides** (`.leaflet-container`, `.leaflet-bar`, `.leaflet-control-attribution`), lines 259-340.
- **The pin and cluster rules** (`.cm-pin`, `.cmp*`, `.cmc*`, `.cm-attr-toggle`, `.cm-area*`), lines 326-424. The comment at lines 330-331 says the pins are HTML strings inside a Leaflet `divIcon`, "where Tailwind's compiler cannot see the classes". Tailwind 4 scans source files as plain text for whole class names, so a class written whole inside a string in `PlaceMarkers.tsx` would be found. Step 5 tests that claim before relying on it.
- **Three helper classes used from JSX**: `.tnum` (22 uses), `.label-cap` (4) and `.scroll-fade-x` (3). They are written as plain classes, so `eslint-plugin-better-tailwindcss` reports them as unknown (29 of the 34 `no-unknown-classes` findings, measured 2026-11-10).
- **Global rules**: `::selection`, `:root { accent-color }`, the scrollbar rules, and `:focus-visible`.
  - `:focus-visible { outline…; border-radius: 3px }` is unlayered, so it beats `rounded-*` utilities on every focused element: a `rounded-full` chip squares off to 3 px when it takes focus. That is a quiet bug, not a design.
- **The `.dark` and `:root` token blocks** (lines 22-129) set custom properties only, and stay.

**Where Leaflet's CSS should sit.** In a low layer, before Tailwind's:

*(Changed 2026-11-11, from the base-ui skill's measurement: declare `vendor` **after** `base`, as `@layer theme, base, vendor, components, utilities;`. With `vendor` first, Tailwind's reset beat Leaflet-style rules' borders, padding and margins and made their `img` block; after `base`, the vendor rules held. The skill's `references/tailwind.md` has the stylesheet. Step 3's line below follows this order, not the one shown here.)*

```
@layer vendor, theme, base, components, utilities;
@import "tailwindcss";
@import "leaflet/dist/leaflet.css" layer(vendor);
```

The `@layer` statement comes first so `vendor` is the lowest layer. Then the app's Leaflet overrides go in `@layer components`, and they win without `!important`. Two things make this safe to verify:

- Leaflet's own `!important` rules (`max-width: none !important` on tiles, for example) still win over Tailwind's preflight `img { max-width: 100% }`, because an important declaration in an earlier layer beats a normal one in a later layer. The preflight can still change Leaflet's non-important defaults (`img` and `svg` display, `a` colour), so the screenshots and the e2e map specs are the check, not the argument.
- `eslint-plugin-better-tailwindcss` then no longer sees the vendor sheet as part of the entry point, and reports nothing for it.

**`eslint-plugin-better-tailwindcss` 4.10.0 on `ui/app`**, entry point `ui/app/app.css`, over `ui/app/**/*.{ts,tsx}` (measured 2026-11-10 on a scratch copy):

| Rule | Findings |
|---|---|
| `no-unknown-classes` | 34 (22 `tnum`, 4 `label-cap`, 3 `scroll-fade-x`, 5 others) |
| `no-deprecated-classes` | 5 (`backdrop-blur` ×3, `rounded` ×2) |
| `no-conflicting-classes`, `no-duplicate-classes` | 0 |
| `enforce-consistent-class-order` | 10 |
| `enforce-canonical-classes` | 97 (`h-8 w-8` to `size-8`, `z-[400]` to `z-400`, `h-[100dvh]` to `h-dvh`) |
| `enforce-logical-properties` | 412 |
| `enforce-consistent-line-wrapping` | 194 |

The correctness rules are the ones brief 27 turns on as errors, and the class-order rule once a repo has migrated: 49 findings between them. The other four are style, left off: logical properties (412) would rewrite `ml-` to `ms-` across a Romanian and English left-to-right app, and line-wrapping duplicates Prettier.

## Owner decisions

**Decided 2026-11-10 (owner)** (see Context): Q18, Q19, Q58 (form dialogs and confirms), Q40.

**Decided 2026-11-10 (technical call), unless a line says otherwise:**

1. **Base UI only under `ui/`** (Q15). Decided: yes. The three files outside move behind wrappers in `ui/app/components/ui/`.
2. **Where native controls stay** (Q16). Decided: text, search and URL inputs, which the admin forms and auth pages use. The `<select>` in the add-a-source form does not stay native: this repo's decisions don't keep it native on phones, and the admin is a desktop tool.
3. **The place sheet** (Q40 covers phone navigation panels; this is a content sheet). Decided as a default, since the call is the Drawer's own: it becomes the new `Drawer` wrapper on `@base-ui/react/drawer`: `swipeDirection="down"`, `snapPoints` for peek and full, `modal={false}`, so the map behind a peeking sheet still takes pans and pin taps. 1.9.0's `DrawerRoot` types have all three props (`modal?: boolean | 'trap-focus'`, `snapPoints`, `defaultSnapPoint`, checked 2026-11-10 in the published `.d.ts`). A spike in step 6 proves the map stays usable at the peek snap. If it can't, the sheet stays hand-built, recorded in `scripts/conventions.json` with that reason, and only its Escape guard changes. The owner chose the Drawer for phone navigation panels (Q40); the sheet follows the same pattern.
4. **The always-one-chosen control** (Q41, Q57). Decided: a filter that switches what a list shows uses `RadioGroup`, so `Segmented` (the lens and draw-mode choices, which apply at once) goes on `RadioGroup`, and arrow keys may choose. A picker that **saves** on each choice uses a guarded `ToggleGroup`: the language switch stores `civicmap-lang` on each press, so `LangToggle` goes on a `ToggleGroup` whose arrow keys move focus without saving and where one item always stays pressed. Step 5 builds both.
5. **A DOM test environment** (Q60). Decided: jsdom tests only for wrappers that hold logic; flows stay in Playwright, as the specs here already do. The one wrapper with logic is `Dialog` (the Escape guard and the initial-focus order). Add `jsdom` as a pinned devDependency, and one test for it, `ui/app/components/ui/Dialog.test.tsx`, run by a jsdom environment set for that file only (`// @vitest-environment jsdom`), so the UI project's node default and its `*.test.ts` include keep working (widen the include to `*.test.{ts,tsx}`). No other wrapper gets a jsdom test.
6. **Tooltips and Base UI `Button`.** Default (no question covers it): neither in this brief.
7. **Motion.** Default (no question covers it): the global `prefers-reduced-motion` rule stays (it covers Leaflet's animations too), recorded as an exception to rule 7's `motion-safe:` in `scripts/conventions.json`. The 13 arbitrary durations and easings become the tokens.
8. **The type scale** (Q62). Decided: a named type scale in `@theme`, no `phone` variant, and tests that select by role. The 17 distinct `text-[Npx]` sizes (137 uses in `ui/app`, measured 2026-11-10: `12px` ×25, `13px` ×22, `13.5px` ×19, `12.5px` ×18, `11.5px` ×15, down to `9.5px` and `19px` once each) become same-pixel `--text-*` entries in `@theme`, named by role, and the 137 uses move to the utilities. Same pixel values, so Q19's parity holds. The app's phone breakpoint (`max-width: 767px`, `useIsMobile`, `app.css:277`) is exactly Tailwind's `max-md:`, so `max-md:` is used and the one-pixel edge is accepted. The e2e specs use no `data-testid` (0 found), so nothing changes there; a `data-testid` is added only where no role fits.
9. **Token names** (Q17). Decided: this app keeps its names (`fg`, `surface`, `accent`, `line`) until its redesign (brief 06).
10. **The root font size** (Q44). Decided: no change. The 14.5px size is already on `body` (`ui/app/app.css:205`), and `html` sets no size, so the reader's own font setting still scales it. The brief must not move it onto `html`.
11. **The `vite-ui-theme` storage key.** Default (no question covers it): keep it, so existing choices survive. It is a template leftover; renaming it is a one-line change if the owner wants it, with a migration read of the old key.

## Files you OWN

- `ui/app/components/ui/**`: the new and rebuilt wrappers above.
- `ui/app/components/FavoriteStar.tsx`, `ui/app/components/shell/Bell.tsx`, `ui/app/components/shell/NoticeToast.tsx`, `ui/app/components/shell/LangToggle.tsx`, `ui/app/components/place/PlaceSheet.tsx`, `ui/app/components/place/PlacePanel.tsx`, `ui/app/components/place/PlaceDetail.tsx`, `ui/app/components/map/AreaDraw.tsx` (the Escape guard), `ui/app/components/map/FilterBar.tsx` (if the chip props change), `ui/app/routes/archive.tsx`, `ui/app/routes/admin/review.tsx`, `ui/app/routes/admin/sources.tsx`.
- `ui/app/components/ThemeProvider.tsx`, `ui/app/components/ThemeToggle.tsx`, `ui/app/lib/map.ts` (`useIsDarkMode` only), `ui/app/root.tsx` (the theme script and the `theme-color` meta).
- `ui/app/app.css`: the layers, the `@custom-variant`, the leftovers.
- `ui/app/components/ui/CategoryBadge.tsx`, `EventList.tsx`, `EventPlaceRow.tsx`: the inline colours.
- `ui/app/lib/utils.ts` and its new test, and `ui/app/components/ui/Dialog.test.tsx` with `ui/vitest.config.ts` (decision 5).
- `eslint.config.js`: `better-tailwindcss` rules. `ui/package.json`: `eslint-plugin-better-tailwindcss` 4.10.0 as a pinned devDependency (in the root `package.json` if brief 03 put ESLint there).
- `e2e/theme.spec.ts` (new) and the Escape and sheet checks in `e2e/place.spec.ts` and `e2e/map.spec.ts`.
- `scripts/conventions.json`: the exceptions (decisions 3 and 7).
- `.claude/rules/ui.md`: the Tailwind and theme lines.
- Corpus: [wiki/decisions-ui.md](../../wiki/decisions-ui.md) (the theme decision and the Base UI conventions), [wiki/decisions-engineering.md](../../wiki/decisions-engineering.md) (the "UI primitives" line, which names only five primitives), [wiki/architecture.md](../../wiki/architecture.md) (the components line), [wiki/status.md](../../wiki/status.md), [log.md](../../log.md), and the theme checks in [TP-04](../../test-plans/TP-04-ui-audit.md).

## Files you must NOT touch

- `backend/` and `shared/`.
- `ui/app/lib/i18n.tsx`'s wording, except new strings for the share popover (both languages).
- The behaviour of the map: pins, clusters, filters and draw-to-filter. They move onto layers; they do not change.
- The Ward library in `ui/vendor/`.
- `ui/app/components/place/PlacePanel.tsx` beyond its Escape listener.

## What to do

One commit per numbered step. After each, `npm run check` passes, with `check-base-ui` `--warn-only`.

1. **Before.**
   - Run `check-base-ui` strict (against `ui/app`; brief 03 step 6 puts the roots in `scripts/conventions.json`) and record the counts by rule. Expect rule 3 at 3, rule 6 at 2, rule 8 at 20 (or however the checker counts z-indexes), rule 11 at 1.
   - Run `eslint-plugin-better-tailwindcss`'s correctness rules and record the 34 and 5.
   - Take Playwright screenshots, at 1280 and 390 px, **in light and in dark**, kept out of git: the map with a place open, the place sheet at peek and at full on a phone, what's on, the archive (both tabs), about the data, login, settings, the admin review panel and the add-a-source form, and each menu and popover open. `ui-test-plans` has the bring-up.
2. **The stylesheet's layers.**
   1. Add the `@layer vendor, theme, base, components, utilities;` line and `layer(vendor)` on the Leaflet import.
   2. Move the Leaflet overrides (lines 259-340) into `@layer components`, then delete each `!important` that existed only to beat Leaflet's specificity. Keep Leaflet's own.
   3. Move the pin rules (lines 326-424) into `@layer components`, unchanged. On a scratch copy, write one pin class as a utility inside a `PlaceMarkers.tsx` string and build, to find out whether Tailwind generates it. If it does, correct the comment and leave the rest of the pin rules for a later brief, since `color-mix` and per-category variables read better as CSS.
   4. Make `.tnum`, `.label-cap` and `.scroll-fade-x` `@utility` blocks, so they are real utilities in the utilities layer and `better-tailwindcss` knows them.
   5. Move `::selection`, the scrollbar rules and `:focus-visible` into `@layer base`, and drop `border-radius: 3px` from `:focus-visible` so the focus ring follows each element's own radius. Take the screenshots again with Tab focus on a chip.
   6. Turn the two `@keyframes` and their `.cm-panel-in` and `.cm-sheet-in` classes into `--animate-*` entries in `@theme` and `animate-*` utilities.
   7. Check, with the command in the acceptance list, that no top-level rule is left outside a layer except the two token blocks.
3. **The tokens and small slips.**
   - `ui/app/components/ui/Button.tsx:26`: `text-white` on the danger variant becomes a `--fg-on-danger` token, beside `--fg-on-accent`.
   - `ui/app/routes/admin/review.tsx:359`: `bg-black/30` becomes a `--scrim` token (`--map-scrim` is 6% black and too light for a modal).
   - The four inline colours become a `--cat` custom property set on the element, with `text-(--cat)`, `bg-(--cat)` and `border-[color-mix(in_srgb,var(--cat)_34%,transparent)]`. `PlaceSheet.tsx:99`'s computed geometry stays inline.
   - The 13 arbitrary durations and easings become `duration-(--dur-2)` and `ease-out-fast` (already in `@theme`). The 20 raw z-indexes become tokens in `:root` (`--z-chrome: 400`, `--z-sheet: 600`, and so on, with the same numbers, so no stacking changes), used as `z-(--z-chrome)`.
   - The 17 `text-[Npx]` sizes become named `--text-*` entries in `@theme` at the same pixel values, and the 137 uses move to the named utilities (decision 8). `grep -rnE "text-\[[0-9.]+px\]" ui/app` then prints nothing.
   - `DropdownMenu.tsx:21`: `origin-(--transform-origin)`.
   - `cn()` gets `extendTailwindMerge`, with its test.
4. **The wrappers that move, one commit each.** `Popover.tsx` (then `FavoriteStar` and `Bell` use it, which takes rule 3 to 1), `Dialog.tsx` (then `review.tsx` uses it, which takes rule 3 to 0 and rule 12's Dialog gaps to 0). Keep every behaviour:
   - `Bell`'s `onOpenChange` marks notifications read once, on open;
   - the signed-out star's popover keeps its title, description and the two links with the `next` parameter;
   - the review panel keeps its Leaflet map, its candidate buttons and its close button's `aria-label`.
5. **The widgets onto Base UI, one commit each.** `Toast` (with `NoticeToast`), `Tabs` (archive: keep `archive-panel`'s `aria-labelledby` semantics, now Base UI's), `Segmented` on `RadioGroup` and `LangToggle` on the guarded `ToggleGroup` (decision 4), `Chip` on `Toggle`, `Checkbox` (three sites; the select-all keeps its indeterminate-free behaviour), `Select` (the city field keeps its `name` and its default).
6. **The place sheet.** Build `Drawer.tsx` and move `PlaceSheet` onto it, per decision 3. Keep:
   - the peek and full heights (`PEEK_SHIFT`, `FULL` in `PlaceSheet.tsx`) as `snapPoints`;
   - the attribution lift above the sheet (`.sheet-peek`, `.sheet-full` in `app.css:281-282`, driven by `setSheetSnap`);
   - close on a downward swipe from peek, the X, and Esc;
   - the tab bar hiding while a place is open (`Navbar.tsx:208`).

   First prove, in a throwaway spec, that with the sheet at peek the map still pans and a pin still opens another place. If not, keep the hand-built sheet and write the exception.
7. **Escape.** Add the guard to the three window listeners (`if (e.key === "Escape" && !e.defaultPrevented)`) and, in `e2e/place.spec.ts`, a test: open a place, open the signed-out star's popover, press Esc, and expect the popover closed and the place still open. If Base UI already stops that, the test passes before the guard and stays as a regression check.
8. **The share fallback.** Replace `window.prompt` with the `Popover` wrapper: a read-only field with the link selected, in both languages.
9. **The theme switch** (Q18).
   1. `ThemeProvider`: default `light`; the resolved theme goes on `<html>` as `data-theme="light"` or `"dark"` (not a class); `system` follows `prefers-color-scheme` and listens for it to change. The stored choice keeps the `vite-ui-theme` key.
   2. `app.css`: `@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));`, the `.dark` token block becomes `[data-theme="dark"]`, `html.dark { color-scheme: dark }` and `.dark .map-fallback .leaflet-tile-pane` follow.
   3. `useIsDarkMode` in `ui/app/lib/map.ts` observes the `data-theme` attribute instead of the class. The two tile choices (`map.tsx:327`, `review.tsx:432`) and the fallback filter keep working.
   4. `root.tsx`: a small inline script in `<head>` reads the stored choice and sets `data-theme` before first paint, so a returning dark user never sees a light flash. Replace the two `theme-color` metas with one that the provider updates.
   5. `ThemeToggle` stays as the control. Check it shows the current choice (Light on a first visit).
   6. `e2e/theme.spec.ts`: a fresh context with `colorScheme: "dark"` still starts light; choosing Dark sets `data-theme="dark"`, survives a reload, and switches the map's tile `src`; choosing System follows an emulated colour-scheme change.
10. **After.**
    - Take the screenshots again. Per Q19, a few pixels of drift are fine. Fix any visible change in layout or colour, and say in the outcome note what the focus-ring change did.
    - Run `check-base-ui` strict (rules 1-3 and 8-11 report 0; rule 7's exception and rule 5's inline geometry are listed) and turn the `--warn-only` off. Turn on `better-tailwindcss`'s correctness rules and class order as errors, and fix their 49 findings.
    - Update the corpus pages listed above and `scripts/conventions.json`, and run `bash corpus/lint.sh` until it is clean.

## Acceptance

- [ ] `grep -rn "@base-ui/react" ui/app --include=*.tsx --include=*.ts | grep -v "components/ui/"` prints nothing.
- [ ] `check-base-ui` strict reports 0 for rules 1, 2, 3, 9, 10 and 11, with the exceptions in `scripts/conventions.json` and their reasons.
- [ ] No top-level CSS rule sits outside a layer except the token blocks. This command prints only `:root` and `:root[data-theme="dark"]` (or `[data-theme="dark"]`):

  ```
  node -e "const p=require('postcss').parse(require('fs').readFileSync('ui/app/app.css','utf8'));p.each(n=>{if(n.type==='rule')console.log(n.selector.replace(/\s+/g,' '))})"
  ```

- [ ] `grep -c '!important' ui/app/app.css` is at most 3 (the reduced-motion rule), down from 21 lines.
- [ ] `npx eslint ui/app` is clean with the `better-tailwindcss` correctness rules and class order as errors.
- [ ] `grep -rnE "window\.(confirm|alert|prompt)" ui/app` prints nothing.
- [ ] `npx playwright test` passes with the new specs: the first visit is light under `colorScheme: "dark"`, the choice persists and the map's tiles follow it, Esc in a popover doesn't close the place, and (if decision 3's spike passed) the map is usable at the sheet's peek.
- [ ] `ui/app/lib/utils.test.ts` shows `cn("text-fg-muted", "text-accent")` returns only `text-accent`.
- [ ] The language switch is a guarded `ToggleGroup`: the arrow keys move focus without changing `civicmap-lang`, and one language is always pressed (a Playwright check). `Segmented` is a `RadioGroup`. The `Dialog` jsdom test passes (decision 5).
- [ ] The built `ui/build/client/index.html` contains the theme script (`grep -c "data-theme" ui/build/client/index.html` is at least 1), so the choice is applied before first paint.
- [ ] Before and after screenshots at 1280 and 390 px, light and dark, show no visible change to layout or colour (Q19).
- [ ] `npm run check` passes, and `bash corpus/lint.sh` ends clean.

## Interplay

- [Brief 01](01-a-source-registry-and-shareable-map-links.md) edits `ui/app/routes/map.tsx`, `ui/app/lib/map.ts` (the attribution string), `ui/app/routes/about-data.tsx` and the map's store. This brief edits `map.ts` (`useIsDarkMode`), `map.tsx` (nothing beyond the dark-tile check, unless the Drawer moves its sheet props) and `PlaceSheet.tsx`. Run them one at a time. If 01 goes first, step 9.3 reads the rewritten file; if this goes first, 01 builds the attribution from the registry in the file as it stands.
- Brief 01's source registry does not gate publishing (owner, 2026-11-10): a source whose permission is pending is shown on the map and credited, and only a `forbidden` source stays off. Map state goes in the URL. If that lands, the share popover in step 8 shows that URL.
- [Brief 05](05-the-server-in-the-code-structure.md) touches no file here. Both add devDependencies, so run them one at a time.
- The skills library's `check-base-ui` walks `src/`, and the skills' `paths:` globs name `web/src/**` and `ui/src/**`. This repo's source is `ui/app/`. That gap is the skills library's to close; until then the checker runs with the repo's source directory set, if it takes one, or `--warn-only`.
