# Task 02: Base UI 1.9.0

**Depends on:**

- In public-resource-map: nothing. This brief runs first, so a visual or behavioural change in the later briefs is never blamed on the bump.
- In the owner's skills library: nothing is needed to build it. It is this repo's row of the brief *Every repo on Base UI 1.9.0*, and replaces it for this repo.

**Runs before:** 03, 04 and 05, and before [brief 01](01-a-source-registry-and-shareable-map-links.md) if that one is promoted first (see Interplay).

**Before you start:** run `brief-board guide` ([corpus/CLAUDE.md](../../CLAUDE.md)).

## Context

On 2026-11-09 the owner decided that every web app they own runs `@base-ui/react` at the latest stable release, **1.9.0**, pinned exactly. On 2026-11-10 npm's `latest` tag was 1.9.0 (`npm view @base-ui/react version`). This repo is on 1.6.0.

### The pin today (read 2026-11-10)

Command: `grep -rn "base-ui" --include=package.json . | grep -v node_modules`.

| File | Spec |
|---|---|
| `package.json` (root) | none |
| `shared/package.json`, `backend/package.json`, `docs/package.json` | none |
| `ui/package.json:12` | `"1.6.0"`, already exact |

The lockfile resolves one copy: `package-lock.json:2047-2048`, `node_modules/@base-ui/react` at 1.6.0, with `@base-ui/utils` 0.3.1 at `package-lock.json:2085-2086`. So only `ui` changes. The "pin exactly" rule already holds; only the version is old.

### The two breaking changes do not touch this repo

1.9.0 renamed `OTPFieldPreview` to `OTPField` (`@base-ui/react/otp-field`) and `sanitizeValue()` to `normalizeValue()`. Command: `grep -rnE "OTPFieldPreview|otp-field|sanitizeValue" --include=*.ts --include=*.tsx . | grep -v node_modules` printed nothing on 2026-11-10.

### Measured on a scratch copy, 2026-11-10

Node 24.22.1, npm 11.19.1, on a scratch copy of the repo's `package.json` files and lockfile:

- `npm install @base-ui/react@1.9.0 --save-exact -w @public-resource-map/ui --package-lock-only --ignore-scripts` changed `ui/package.json` to `"@base-ui/react": "1.9.0"` and nothing else in any `package.json`.
- **The lockfile keeps one hoisted copy**: `node_modules/@base-ui/react` stays at its key. The package count is 1,654 before and after. Eight entries changed and none was added or dropped:

  | Package | Before | After |
  |---|---|---|
  | `@base-ui/react` | 1.6.0 | 1.9.0 |
  | `@base-ui/utils` | 0.3.1 | 0.5.0 |
  | `@floating-ui/core` | 1.7.5 | 1.8.0 |
  | `@floating-ui/dom` | 1.7.6 | 1.8.0 |
  | `@floating-ui/react-dom` | 2.1.8 | 2.1.9 |
  | `@floating-ui/utils` | 0.2.11 | 0.2.12 |
  | `reselect` | 5.2.0 | 5.3.0 |
  | `use-sync-external-store` | 1.6.0 | 1.7.0 |

- With 1.9.0 installed beside a copy of the source, `react-router typegen && tsc` in `ui` printed 0 errors (exit 0). The same command passes on 1.6.0. The three wrapper files' prop usage compiles against 1.9.0's types.
- Peer dependencies of 1.9.0 (`npm view @base-ui/react@1.9.0 peerDependencies`): `react` and `react-dom` `^17 || ^18 || ^19` (this repo is on 19.2.7), `@types/react` `^17 || ^18 || ^19`, and `date-fns` ^4.0.0 and `@date-fns/tz` ^1.2.0, which `peerDependenciesMeta` should mark optional. Step 3 confirms that with `npm ls`, because an unmet required peer would add a package.
- Baseline on a scratch copy of the 1.6.0 tree: `vitest run`, 234 tests in 32 files, all passing (backend 172, shared 38, ui 24).

**Not measured here, so the steps measure it:**

- The Playwright suite (30 tests in `e2e/*.spec.ts`, `grep -cE "^\s*test\(" e2e/*.spec.ts`), which needs a browser and a dev stack.
- `docker build` of `infrastructure/Dockerfile`.
- The 1.6.0 to 1.9.0 release notes.
- Behaviour in a browser.

### What this repo uses

Four files import Base UI, each from a subpath (`grep -rn "@base-ui" --include=*.ts --include=*.tsx ui/app`):

| File | Import | What it uses |
|---|---|---|
| `ui/app/components/ui/DropdownMenu.tsx:1` | `@base-ui/react/menu` | `Root`, `Trigger` (with `render`), `Portal`, `Positioner` (`align`, `sideOffset`), `Popup`, `Item`, `Separator`; the CSS variable `--transform-origin` and the `data-starting-style`, `data-ending-style`, `data-highlighted` and `data-disabled` attributes. Callers: `ui/app/components/shell/CityPicker.tsx`, `ui/app/components/ThemeToggle.tsx`, `ui/app/components/Navbar.tsx:58-101` (an item with `render={<Link />}` at lines 85, 97 and 98). |
| `ui/app/components/FavoriteStar.tsx:1` | `@base-ui/react/popover` | `Root`, `Trigger`, `Portal`, `Positioner`, `Popup`, `Title`, `Description` (a signed-out visitor's explanation) |
| `ui/app/components/shell/Bell.tsx:2` | `@base-ui/react/popover` | the same parts, with `Root`'s `onOpenChange` marking notifications read (lines 23-27) |
| `ui/app/routes/admin/review.tsx:2` | `@base-ui/react/dialog` | `Root` (`open`, `onOpenChange`), `Portal`, `Backdrop`, `Popup`, `Title`, `Description`, `Close` (lines 357-513) |

## Owner decisions (defaults this brief builds)

1. **Pin 1.9.0 exactly.** Default: yes, through `npm install ... --save-exact`. No range.
2. **Nothing else moves.** Default: no general `npm update`, no other dependency. The lockfile diff is Base UI's own tree and nothing else.
3. **A visual change the bump causes** is logged in the outcome note and left. It is not restyled here; brief 04 owns the markup and the styling.

## Files you OWN

- `ui/package.json` (the one line) and `package-lock.json`.
- A source file only if a breaking or behavioural change forces it. Expect none: the typecheck passes on the scratch copy.
- [wiki/status.md](../../wiki/status.md) and [log.md](../../log.md). No wiki page names the Base UI version (`grep -rn "1\.6\.0" corpus/wiki` finds nothing), so no other page changes.

## Files you must NOT touch

- Styling: no edit to `ui/app/app.css`.
- `backend/`, `shared/`, `docs/`, and every other dependency.
- The wrappers' props. A fix the bump forces keeps each wrapper's public API.

## What to do

One commit for the bump, `chore(deps): @base-ui/react 1.9.0`. The suite is green before it, and you record the baseline first.

1. **Baseline and changelog.**
   - On the untouched tree run `npm run test` and `npm run typecheck`, then `npx playwright test`. Record each result and the counts (234 unit tests in 32 files; 30 e2e tests). If something fails before the bump, name the test and treat that as the baseline.
   - Read the `@base-ui/react` release notes from v1.6.0 to v1.9.0. In the outcome note write one line per part group (Menu, Popover, Dialog): either "nothing in these notes touches what the wrapper uses", or the note and what you checked. Look at focus, dismissal, animation and positioning changes.
2. **Re-run the grep** for `OTPFieldPreview`, `otp-field` and `sanitizeValue`. Expect no hits.
3. **Install.** `npm install @base-ui/react@1.9.0 --save-exact -w @public-resource-map/ui`. Check that the lockfile resolves 1.9.0 and that only the eight entries above changed:

   ```
   node -e "const p=require('./package-lock.json').packages;console.log(Object.entries(p).filter(([k])=>k.endsWith('/@base-ui/react')).map(([k,v])=>k+' '+v.version))"
   ```

   Run `npm ls @base-ui/react date-fns @date-fns/tz` and confirm no new package appeared.
4. **Scripts.** `npm run typecheck`, `npm run test`, `npm run build`, then `npx playwright test`. Fix only what the bump broke.
5. **Behaviour in a browser.** Start `npm run dev`, then check each part at 1280 and 390 px wide, with the keyboard and with the pointer. Write down anything that differs from 1.6.0.

   | Part | Where to see it | Check |
   |---|---|---|
   | Menu | the city picker, the theme menu, and the account menu in the top bar | opens on click and on Enter, arrows move the highlight, Enter chooses, Esc closes, focus returns to the trigger, the popup scales from its trigger, and the Settings item navigates (a `Link`, not a button) |
   | Popover | the bell (signed in), and the star on a place when signed out | opens, Esc closes, an outside press closes, the title and description are announced, and opening the bell marks notifications read once |
   | Dialog | the admin review panel (`/prm/admin`, signed in as an admin; `npm run db:set-role -w backend` makes one) | opens from a row, Esc closes, a backdrop click closes, Tab stays inside, focus returns to the row, page scroll is locked behind it, and the Leaflet map inside still takes clicks |

6. **Commit** with the message above. Then update [wiki/status.md](../../wiki/status.md) and [log.md](../../log.md) with a `done` entry, in one corpus commit. Run `bash corpus/lint.sh`.

## Acceptance

- [ ] `node -p "require('./ui/package.json').dependencies['@base-ui/react']"` prints `1.9.0`.
- [ ] The step 3 command prints one line, ending `1.9.0`.
- [ ] `grep -rnE "OTPFieldPreview|otp-field|sanitizeValue" --include=*.ts --include=*.tsx . | grep -v node_modules` prints nothing.
- [ ] `git diff --stat HEAD~1` for the bump commit lists only `ui/package.json` and `package-lock.json`, unless a forced fix is named in the outcome note.
- [ ] `npm run typecheck`, `npm run test` and `npm run build` pass, with at least 234 unit tests in 32 files, and `npx playwright test` passes with at least 30 tests.
- [ ] `docker build -f infrastructure/Dockerfile .` succeeds.
- [ ] The outcome note has one changelog line per part group and the behaviour table's result, or "no difference found".
- [ ] `bash corpus/lint.sh` ends clean.

## Interplay

- Brief 03 (the house-style harness) runs next. It rewrites `package.json` and `package-lock.json` too, so the two never run at the same time.
- Brief 04 starts from a tree already on 1.9.0, so the `Drawer`, `Toast`, `Tabs`, `Checkbox`, `Select`, `RadioGroup` and `Toggle` APIs it uses are the 1.9.0 ones.
- [Brief 01](01-a-source-registry-and-shareable-map-links.md) touches `ui/app/routes/map.tsx` and `ui/app/lib/map.ts`, which this brief does not. It does not depend on this one. Both rewrite `package-lock.json` only if 01 adds a dependency, so run them one at a time.
