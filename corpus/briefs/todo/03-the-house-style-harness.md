# Task 03: The house style and the quality harness

**Depends on:**

- In public-resource-map: [brief 02](02-base-ui-1-9-0.md), for ordering only. Both rewrite `package.json` and `package-lock.json`.
- In the owner's skills library:
  - brief 27, *A house style, and a quality harness that enforces it*: the `house-style` package at `v1.0.0`, the `house-style` skill, and the plugin's `Stop` and `PostToolUse` hooks;
  - brief 15, *Enforce the base-ui and code-structure skills in every repo*: how the convention checkers are wired and when they run `--warn-only`.
- The owner's grilling of 2026-11-10: the skills library's open questions Q5-Q14, Q45-Q51. Q1 is answered (see Context).

**Runs before:** 04 and 05. The reformat touches about 100 TypeScript files, and those two briefs rewrite or move most of them. Formatting first gives one clean reformat commit, and the formatter hook keeps every later diff formatted.

**Before you start:** run `brief-board guide` ([corpus/CLAUDE.md](../../CLAUDE.md)).

## Context

On 2026-11-09 the owner made three calls for every web app they own: Base UI 1.9.0 everywhere, Base UI styled with Tailwind, and the researched conventions enforced in each repo. The skills library's brief 27 measured the house style and found it consistent but unenforced. Its answer is two layers:

- **The repo's gate:** `npm run check` and its fast subset `npm run check:fast`.
- **The Claude Code layer:** the plugin's `Stop` hook runs `check:fast`, its `PostToolUse` hook formats each saved file, `.claude/rules/*.md` are scoped by `paths:`, and a short root `CLAUDE.md` holds the commands.

This repo already uses Tailwind 4.3.1, so it has no Tailwind migration brief. It starts further back than the lineage repos: it has no ESLint, no Prettier, no root `CLAUDE.md`, and no shared tsconfig. This brief adds all of them. Briefs 04 and 05 then turn on their own checks inside it.

The owner answered on 2026-11-10 how services start: every service runs in a container built from its repo's `infrastructure/Dockerfile`, and the build runs `npm ci` and `tsc`, no tests and no lint. So the deploy does not run `npm run check`, and this brief leaves it alone.

### What the repo has today (read 2026-11-10)

- **Layout.** Workspaces `shared`, `backend`, `ui` and `docs` (`package.json:4-9`). The skills library's names are `server/` and `web/`, with `src/`. Here the UI source is `ui/app/` (React Router), not `ui/src/`, and the server is `backend/src/`. Every path glob and checker default in the skills below needs these names.
- **tsconfig.** Three files, no base: `shared/tsconfig.json`, `backend/tsconfig.json` and `ui/tsconfig.json`.
  - Present: `strict`, `verbatimModuleSyntax`, `esModuleInterop`, `skipLibCheck`.
  - Absent: `noUncheckedIndexedAccess`, `noImplicitOverride`, `isolatedModules`, `noUnusedLocals`, `noFallthroughCasesInSwitch`, `erasableSyntaxOnly`.
  - `module` is `ES2022` with `moduleResolution: "bundler"` in all three, where the house uses `NodeNext` for the server. Every relative import in `backend/src` already ends in `.js` (a grep for one without it printed nothing).
- **Nothing typechecks `e2e/`.** No tsconfig includes the 11 files in `e2e/`, nor `playwright.config.ts`. A strict compile of them (`tsc --noEmit --strict --module esnext --moduleResolution bundler --types node e2e/*.ts playwright.config.ts`) printed 0 errors on 2026-11-10, so covering them costs nothing.
- **No formatter, no linter, no `.npmrc`.** Dependencies are pinned exactly anyway (every spec in the five `package.json` files, `overrides` and the `*` workspace links aside).
- **Scripts** (`package.json:10-18`): `typecheck` runs the three workspaces one after another, `test` is `vitest run`, `test:e2e` is `playwright test`. There is no `lint`, `format` or `check`.
- **No root `CLAUDE.md`.** `.claude/` holds only `settings.local.json`. The only `CLAUDE.md` is [corpus/CLAUDE.md](../../CLAUDE.md), which loads only when an agent reads under `corpus/`.
- **`npm test` works on a fresh clone.** On a scratch copy with no `shared/dist`, `vitest run --project backend` passed 172 tests: the backend and UI vitest configs alias `@public-resource-map/shared` to its source. So no `pretest` is needed.

### Measured on 2026-11-10

Taken on a scratch copy with Prettier 3.9.10, typescript-eslint 8.72.2, ESLint 10.14.0, `eslint-plugin-react-hooks` 7.1.1, `eslint-plugin-n` and `@vitest/eslint-plugin` installed beside it, and TypeScript 5.9.3 (the repo's) for `tsc`. The machine was under load (load average about 3.5), so times are rough.

**Prettier churn.** Defaults (double quotes, semicolons), `trailingComma: "all"`, on the 158 TypeScript files in `backend/src`, `shared/src`, `ui/app` and `e2e` (16,889 lines). Command: `prettier --write` then `git diff --shortstat`.

| `printWidth` | Files changed | Insertions | Deletions |
|---|---|---|---|
| 100 | 107 | 2,131 | 761 |
| **120** | **95** | **1,040** | **964** |
| 130 | 98 | 893 | 1,194 |
| 150 | 108 | 820 | 1,474 |

120 changes the fewest lines in total (2,004). Quote style costs nothing: all 655 import lines use double quotes (`grep -rnE "^(import|export) .* from '"` printed 0 for single quotes). The 95th-percentile line is 92 characters, and 144 lines are over 120.

The other file types, at width 120:

- `ui/app/app.css`: 391 of its 461 lines change, because Prettier expands the one-line rules the file aligns by hand.
- JSON: `backend/src/db/fixtures/osm-places.json` changes 36,743 lines (the frozen OSM capture) and the five `backend/drizzle/meta/*_snapshot.json` files about 700 more. All generated.
- Markdown: 714 lines in 29 files.

So the `.prettierignore` is larger here than in other repos (decision 3).

**`tsc` with each flag**, one at a time, `tsc -p <workspace> --noEmit --<flag>`:

| Flag | `shared` | `backend` | `ui` |
|---|---|---|---|
| `noUncheckedIndexedAccess` | 0 | 84 (52 in tests) | 10 |
| `noImplicitOverride` | 0 | 0 | 0 |
| `noFallthroughCasesInSwitch` | 0 | 0 | 0 |
| `noUnusedLocals` | 0 | 2 (`backend/src/db/seed-data.ts:22`, `backend/src/routes/admin-ingest.api.test.ts:4`) | 0 |
| `erasableSyntaxOnly` | 0 | 2 (`backend/src/ingest/pipeline.ts:55, 57`) | 1 (`ui/app/lib/api.ts:14`) |
| `exactOptionalPropertyTypes` (measure only) | 0 | 30 | 8 |
| `module nodenext`, `moduleResolution nodenext` | 0 | 0 | not applicable |

The three `erasableSyntaxOnly` hits are parameter properties (`constructor(readonly status: number, …)`), the same cost other repos found. `noUncheckedIndexedAccess` is in the lineage's house list, so it is adopted here: 94 errors to fix, most of them in tests. `exactOptionalPropertyTypes` is not added now (brief 27 decision 3).

**ESLint.** `@eslint/js` recommended, typescript-eslint `recommended`, the six typed rules through `projectService`, `react-hooks` recommended on `ui/app`, and the house shapes, over `backend/src`, `shared/src`, `ui/app`, `e2e` and `playwright.config.ts` (64 files with findings). 206 findings and 4 parse errors:

| Rule | Findings | Where |
|---|---|---|
| `@typescript-eslint/await-thenable` | 70 | 58 in `backend/src` (`ingest/pipeline.ts` 26, `routes/favorites.ts` 13, `lib/osm-sync.ts` 6, `routes/admin-ingest.ts` 5, `routes/places.ts` 3, `ingest/geocode.ts` 2, `routes/events.ts` 2, `routes/archive.ts` 1), 12 in tests |
| `@typescript-eslint/no-non-null-assertion` | 39 | 17 in `backend/src`, 10 in backend tests, 11 in `ui/app`, 1 in `e2e` |
| `no-console` | 22 | 20 in the five CLI files `backend/src/db/capture-osm.ts`, `migrate.ts`, `seed.ts`, `seed-users.ts`, `set-role.ts`; 2 in `ui/app/lib/api.ts` |
| `n/no-process-env` (outside `config.ts`, tests excepted) | 19 | 12 files in `backend/src`, listed in [brief 05](05-the-server-in-the-code-structure.md) |
| `@typescript-eslint/no-unnecessary-type-assertion` | 17 | 3 in `backend/src`, 8 in backend tests, 6 in `ui/app` |
| `vitest/valid-expect` | 12 | all of the form `expect(value, "message")`, which vitest allows: false findings (decision 5) |
| `@typescript-eslint/no-misused-promises` | 8 | all in `ui/app`: `Navbar.tsx:87`, `PlaceDetail.tsx:104`, `routes/map.tsx:340`, `routes/place.tsx:102, 125, 127`, `routes/settings.tsx:104, 207` |
| `@typescript-eslint/no-floating-promises` | 5 | `Navbar.tsx:88`, `routes/login.tsx:28`, `routes/map.tsx:110`, `routes/register.tsx:29`, `routes/settings.tsx:208` |
| `@typescript-eslint/no-explicit-any` | 4 | `backend/src/routes/admin-ingest.api.test.ts:80, 97`, `backend/src/routes/favorites.api.test.ts:28`, `ui/app/lib/LocalStorage.ts:31` |
| `@typescript-eslint/no-unused-vars` | 3 | `backend/src/db/seed-data.ts:22`, `backend/src/routes/admin-ingest.api.test.ts:4`, `shared/src/types/place.test.ts:60` |
| `react-hooks/set-state-in-effect` | 3 | `components/place/PlaceSheet.tsx:46`, `lib/i18n.tsx:799`, `routes/map.tsx:252` |
| `@typescript-eslint/consistent-type-imports` | 2 | `backend/src/routes/event-mapper.ts:2`, `e2e/map.spec.ts:6` |
| `react-hooks/refs` | 1 | `components/place/PlaceSheet.tsx:102` |
| `no-useless-assignment` | 1 | `ui/app/lib/LocalStorage.ts:6` |
| `@typescript-eslint/switch-exhaustiveness-check` | 0 | |
| parse errors | 4 | `e2e/*.ts`: no tsconfig includes them (decision 4) |

**The 58 `await-thenable` hits in `backend/src` are a real finding.** Drizzle's better-sqlite3 driver answers synchronously, so `await db.select()…all()` awaits a plain array. The `await`s are harmless and the fix is to delete them, 58 edits. Several handlers (`routes/favorites.ts`) are `async` only for them.

`@typescript-eslint/switch-exhaustiveness-check` with `considerDefaultExhaustiveForUnions: true` finds nothing.

**Lint time**, 3 workspaces (`backend/src`, `shared/src`, `ui/app`), 158 files: `projectService` 19.5 s, `project` (three explicit tsconfigs) 29.5 s. One changed file with `projectService`: 6.8 s. The root `npm run typecheck` took 16-27 s over three runs, because it starts four processes and runs `react-router typegen`. A `check:fast` of typecheck plus changed-file ESLint is therefore about 25-35 s here, over the 15 s the skills library targets (its Q10). Decision 7 says what to do.

**The house shapes**, over `backend/src`, `shared/src`, `ui/app` and `e2e` (158 files):

| Shape | Count | Where |
|---|---|---|
| `enum` | 0 | |
| `any` | 4 | listed above |
| non-null `!` | 39 | listed above |
| `@ts-ignore`, `@ts-nocheck`, `@ts-expect-error` | 0 | |
| `TODO` / `FIXME` | 0 | |
| `console` | 22 | listed above |
| default exports | 17 | `ui/app/routes.ts:8`, `ui/app/root.tsx:82`, `ui/app/components/Layout.tsx:21` and 14 route files under `ui/app/routes/`: all required by React Router |
| parameter properties | 3 | `backend/src/ingest/pipeline.ts:55, 57`, `ui/app/lib/api.ts:14` |
| classes | 5 | four `Error` subclasses and `ui/app/lib/LocalStorage.ts:1` (static methods only) |

Dates and the other measurements came from `grep` and ESLint runs on a scratch copy, never the repo.

## Owner decisions (defaults this brief builds)

1. **Where the configs come from** (the skills library's open questions, Q5-Q6). Default: the `house-style` package, extended from this repo's configs. The Docker `deps` stage runs `npm ci` and installs only `python3 make g++` (`infrastructure/Dockerfile:21`), so there is no `git` in it. A `github:` dependency needs git there. Default within that: the tagged tarball URL, which npm fetches without git, or `git` added to that `apk add` line in the same commit. If Q6 goes the other way, the same rules land as local files with a version header. Steps 3-5 don't change.
2. **Width** (Q8, Q51). Default: the estate's one width. This repo's least churn is 120. If the estate width isn't settled when this runs, use 120 and record it.
3. **What Prettier covers.** Default: TypeScript, TSX and the config JSON. `.prettierignore` lists:
   - `*.md` (the corpus is prose that `corpus/lint.sh` governs; Q45);
   - `*.css`: `ui/app/app.css` would change 391 of 461 lines, and its aligned token tables are the repo's own style. Brief 04 moves the file into layers, and Prettier can cover CSS after that if the owner wants it;
   - `backend/drizzle/`, `backend/src/db/fixtures/` (generated or frozen);
   - `backend/vendor/` and `ui/vendor/` (Ward's library, generated);
   - `package-lock.json`, `**/build/`, `**/dist/`, `**/.react-router/`, `docs/`, `e2e/.data/`, `playwright-report/`.
4. **tsconfig** (Q11). Default: a root `tsconfig.base.json` with the house flags (`strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `isolatedModules`, `noUnusedLocals`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax`, `erasableSyntaxOnly`, `NodeNext`), extended by `shared`, `backend` and `ui` (the UI overrides `module` and `moduleResolution` back to `ES2022` and `bundler`). Add `e2e/tsconfig.json` so `typecheck` covers the e2e files and typed lint can find them. Not `exactOptionalPropertyTypes` (30 and 8 errors).
5. **Typed lint** (Q12). Default: the six rules through `projectService`, unless `project` measures faster. It didn't (19.5 s against 29.5 s). `vitest/valid-expect` gets `maxArgs: 2`, because `expect(value, "message")` is valid vitest and all 12 findings are that form. Per brief 27's rule, a rule that is mostly false is brought to the owner, not loosened silently: this one is reported, and the option is the fix.
6. **The house shapes as errors** (Q13, Q47). Default: all of them are errors. The 39 `!` are fixed, not excepted, in source and in tests (Q47's default makes them a warning in tests; follow its answer if it has come). `no-console` allows the five CLI files in `backend/src/db/` and the migration and seed scripts. `no-default-export` allows `ui/app/root.tsx`, `ui/app/routes.ts`, `ui/app/components/Layout.tsx`, `ui/app/routes/**` and `*.config.*` (Q49 is about React components in general; these are framework entry points). `n/no-process-env` starts as a **warning**, because its 19 findings are brief 05's work, and brief 05 turns it into an error.
7. **`check:fast`** (Q10). Default: `tsc -b` with incremental builds, then ESLint on the files changed against `HEAD` plus untracked ones. It misses the 15 s target on a cold run and should fit warm; record both times. If it stays over, the owner decides whether a longer `Stop` gate is acceptable. `npm run check` does not run the 30 Playwright tests, which need a browser and a dev stack; `test:e2e` stays its own script.
8. **The Claude Code layer** (Q7). Default: the plugin's hooks. If the owner chooses committed hooks, add them to `.claude/settings.json` here.
9. **A root `CLAUDE.md`** (Q46). Default: create one, and move the repo-wide rules out of [corpus/CLAUDE.md](../../CLAUDE.md) into it only where they apply outside the corpus (the brief-board lines stay readable from both).
10. **`save-exact`.** Default: add `.npmrc` with `save-exact=true`, as 10 of 19 repos have. Every spec is exact today; this keeps the next `npm install` honest.

## Files you OWN

- New: `tsconfig.base.json`, `e2e/tsconfig.json`, and edits to `shared/tsconfig.json`, `backend/tsconfig.json` and `ui/tsconfig.json` (extend the base; the UI keeps its `paths` and `rootDirs`).
- New: `eslint.config.js`, the Prettier config, `.prettierignore`, `.git-blame-ignore-revs`, `.npmrc`.
- The root `package.json` (scripts, devDependencies) and `package-lock.json`.
- The reformat itself: whitespace-only changes to every file Prettier covers.
- The fixes the new rules ask for, in `backend/src`, `shared/src`, `ui/app` and `e2e`:
  - the 58 redundant `await`s in `backend/src`;
  - the 39 `!`;
  - the 22 `console` calls outside the allowed CLIs (2 in `ui/app/lib/api.ts`);
  - the 17 unnecessary assertions, 8 misused and 5 floating promises, 4 `any`, 3 unused variables, 3 parameter properties;
  - the 94 `noUncheckedIndexedAccess` errors;
  - the 5 `react-hooks` findings, each fixed or listed in the outcome note with its reason (`PlaceSheet.tsx` is rebuilt in brief 04, so list its two).
- New: `.claude/rules/ui.md`, `.claude/rules/backend.md`, `CLAUDE.md`.
- [corpus/CLAUDE.md](../../CLAUDE.md), only to point at the root `CLAUDE.md`.
- `scripts/conventions.json` (new, brief 15's exceptions file), if an exception is needed.
- `infrastructure/Dockerfile`: only the `apk add` line, and only under decision 1's `git` branch.
- Corpus: [wiki/decisions-engineering.md](../../wiki/decisions-engineering.md) (a new entry), [wiki/status.md](../../wiki/status.md), [log.md](../../log.md).

## Files you must NOT touch

- Behaviour. Apart from the fixes listed above, every change is formatting or configuration. Removing an `await` of a synchronous value changes nothing observable.
- `backend/vendor/` and `ui/vendor/`: generated copies of the Ward library, ignored by ESLint and Prettier.
- The layout of `backend/src` and the CSS and Base UI work, which are briefs 05 and 04.
- The skills library and the `house-style` repo. A rule that seems wrong here is reported back, not patched locally.
- `ui/app/app.css`: not reformatted (decision 3).

## What to do

One commit per step, each with `npm run typecheck`, `npm test` and `npm run build` green.

1. **Re-measure.** On the day, repeat the Prettier, `tsc` and ESLint measurements above, and record them in the `log.md` entry. Any rule that finds more than about 20 real problems, or mostly false ones, goes back to the owner before it is turned on.
2. **Prettier and the reformat.**
   1. Add `prettier` (pinned) and the config: `printWidth` per decision 2, `trailingComma: "all"`, the rest default.
   2. Add `.prettierignore` (decision 3), `"format": "prettier --write ."` and `"format:check": "prettier --check ."`, and commit this alone.
   3. Run `npm run format` and commit only that, as `style: format with Prettier`. Run it when no other brief has uncommitted work.
   4. Add that commit's full hash to `.git-blame-ignore-revs`, in its own commit, and hand the owner the one-time `git config blame.ignoreRevsFile .git-blame-ignore-revs`.
3. **tsconfig.** Add `tsconfig.base.json` and `e2e/tsconfig.json`, and make the three workspaces extend the base. Then fix what each flag reports: parameter properties become declared fields assigned in the constructor (`ui/app/lib/api.ts:14`, `backend/src/ingest/pipeline.ts:55, 57`), the 2 unused locals are deleted, and the 94 index accesses get a guard or a default, in `backend/src` and `ui/app`. `npm run typecheck` now also runs the e2e project. The Dockerfile's `npm run build -w @public-resource-map/shared` and `-w @public-resource-map/backend` must still build.
4. **ESLint.** Add the config and its dependencies (pinned). Roots: `backend/src`, `shared/src`, `ui/app`, `e2e`. The CLI files are `backend/src/db/{capture-osm,migrate,seed,seed-users,set-role}.ts` and `backend/src/index.ts` (later `server.ts`). Typed linting finds files through `projectService`, which now sees every workspace and `e2e`; `playwright.config.ts` and the vitest configs take `allowDefaultProject`. The diff in effect, against no config:

   | Rule | After | Findings today |
   |---|---|---|
   | `@eslint/js` and typescript-eslint recommended | error | 4 (3 unused variables, 1 useless assignment) |
   | the six typed rules above | error | 102 |
   | `no-non-null-assertion` | error | 39 (fix them) |
   | `no-restricted-syntax` on `TSEnumDeclaration` | error | 0 |
   | `no-warning-comments` (`todo`, `fixme`), pointing at `corpus/todos/` | error | 0 |
   | `no-console` outside the CLIs | error | 2 |
   | `no-default-export` outside the framework entry files | error | 0 after the allowlist |
   | `n/no-process-env` on `backend/src` outside `config.ts` and tests | **warn**; brief 05 makes it an error | 19 |
   | `@vitest/eslint-plugin` recommended on tests, `maxArgs: 2` | error | 0 |
   | `react-hooks` recommended on `ui/app` | error | 4 |
   | `ban-ts-comment` (only `@ts-expect-error` with a description), `no-explicit-any` | error | 4 |
   | `better-tailwindcss` | absent; brief 04 adds it | |

   Fix what the typed rules find. A finding left stays listed in the outcome note with its reason.
5. **The gate.** In the root `package.json`:
   - `lint` is `eslint .`;
   - `check` runs `typecheck`, `lint`, `format:check`, `check:conventions` and `test`;
   - `check:conventions` runs knip and the two convention checkers. `check-base-ui` walks `src/`, and this repo's UI source is `ui/app/`, so it cannot find the files until the skills library's brief 02 takes a source directory or the checker reads `conventions.json`. Until then it runs `--warn-only`, with its gap recorded, and brief 04 makes it strict. `check-structure` runs `--warn-only` until brief 05. The skills library's brief 15 says a repo already on Tailwind runs `check-base-ui` strict from the start; this repo has the rule 3 findings listed in brief 04, so it cannot;
   - `check:fast` per decision 7.

   knip needs to know about React Router's file routes (`ui/app/routes.ts`) and the `docs` workspace. Time `check:fast` warm with one changed file, and `check` in full, and record both.
6. **`.claude/rules/`.** Each file stays under about 40 lines, carries the rules an agent must hold while editing there, and points at the skill for the rest.
   - **`ui.md`** (`paths: ["ui/app/**"]`):
     - read the `base-ui` skill, and [wiki/decisions-ui.md](../../wiki/decisions-ui.md) for the design;
     - Base UI only through the wrappers in `ui/app/components/ui/`, from subpaths (brief 04 makes this true);
     - tokens come from `ui/app/app.css`, and colour from `--color-*`, never a raw value;
     - a trigger around a component uses `render`;
     - user-facing text goes through `useI18n()` in both Romanian and English (`ui/app/lib/i18n.tsx`);
     - the map's pins are HTML strings in `ui/app/components/map/PlaceMarkers.tsx`, so their classes live in `app.css`.
   - **`backend.md`** (`paths: ["backend/src/**", "shared/src/**"]`):
     - read the `code-structure` skill and [wiki/architecture.md](../../wiki/architecture.md);
     - `shared/` zod schemas are the API contract, and `shared` builds first;
     - the vendored Ward library in `backend/vendor/` is generated, so never edit it;
     - every route is admin-gated through `requireRole(ROLES.admin)` or listed as public in `backend/src/ward/auth.ts`;
     - tests go through `buildTestApp` in `backend/src/test/harness.ts`;
     - times use `backend/src/lib/time.ts`, which owns the Europe/Bucharest windows.

     Brief 05 adds the structure lines.
7. **`CLAUDE.md`** at the root, under about 60 lines:
   - one line on what the app is;
   - "read [corpus/index.md](../../index.md) first";
   - the commands: `npm run dev`, `npm run check` before every hand-back, `npm run check:fast`, one test with `npx vitest run <file>`, `npm run test:e2e`, and the db scripts (`db:migrate`, `db:seed`, `db:seed-users`, `db:set-role` with `-w backend`);
   - the places that mislead: `shared` builds first (`npm run build`), the typecheck is four processes, `.env` sits at the repo root and both dev servers read it with `--env-file-if-exists`, the API is on 3001 and Vite on 5173 in development, the app lives under `/prm/` in production (`PRM_BASE`), and the UI source is `ui/app/`, not `ui/src/`;
   - the hard rules from [corpus/CLAUDE.md](../../CLAUDE.md) that apply outside the corpus.
8. **Corpus.** Add a [wiki/decisions-engineering.md](../../wiki/decisions-engineering.md) entry "The house style, formatted and checked", with the width, the config source, the `.prettierignore` reasons and what was rejected. Update [wiki/status.md](../../wiki/status.md) and [log.md](../../log.md), and run `bash corpus/lint.sh` until it is clean.

## Acceptance

- [ ] `npm run check` passes. Its run time and `check:fast`'s, warm with one changed file, are in the outcome note, and `check:fast` is under about 15 s or the owner has accepted the time.
- [ ] `npx prettier --check .` passes. The reformat is one commit that changes whitespace only (`git diff -w <hash>^ <hash>` shows nothing outside the reformat), and its hash is in `.git-blame-ignore-revs`.
- [ ] `tsconfig.base.json` has the house flags, and `npm run typecheck` covers `e2e/`. `docker build -f infrastructure/Dockerfile .` passes.
- [ ] `npx eslint .` reports zero errors with every rule in step 4's table. The counts before and after are in the outcome note, and so is every finding left with its reason.
- [ ] `grep -rn "await " backend/src --include=*.ts` no longer shows an `await` on a Drizzle `.all()`, `.get()` or `.run()` call: the `await-thenable` rule reports 0.
- [ ] A deliberate `enum`, `!`, `console.log` in `backend/src/app.ts`, `// TODO` and an `export default` in a non-route file each fail `npm run lint`. Revert them after.
- [ ] `npm test` still passes at 234 tests or more, and `npx playwright test` at 30 or more.
- [ ] `.claude/rules/ui.md` and `backend.md` exist with `paths:` frontmatter. The root `CLAUDE.md` is under about 60 lines and lists `npm run check`.
- [ ] With the plugin's hooks on, an agent's edit is formatted on save, and a type error stops it at `Stop`.
- [ ] `bash corpus/lint.sh` ends clean.

## Interplay

- [Brief 04](04-base-ui-by-the-conventions.md) adds `better-tailwindcss` and turns `check-base-ui` strict. [Brief 05](05-the-server-in-the-code-structure.md) adds dependency-cruiser, drops `check-structure`'s `--warn-only`, and turns `n/no-process-env` into an error.
- [Brief 01](01-a-source-registry-and-shareable-map-links.md) adds new TypeScript files (`shared/src/sources.ts`, a generator script) and edits `backend/src/ingest/adapters.ts` and `pipeline.ts`. Run it after this brief, so its files are formatted and linted from the start. It must not run while the reformat commit is being made.
- The skills library's `check-structure` regex `.parse(request.` finds nothing here, because the routes call `safeParse(req.…)`, 14 sites in 7 files. That is brief 05's finding to pass back.
