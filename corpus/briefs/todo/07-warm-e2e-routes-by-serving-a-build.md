# Task 07: The e2e suite serves a build, so cold deep links stop timing out

**Depends on:** nothing. It changes only `playwright.config.ts` and the corpus.

**Origin:** the todo `2026-11-12-cold-deep-links-time-out-in-e2e`, promoted 2026-11-13 and removed from `todos/` in the same commit.

**Before you start:** run `brief-board guide` ([corpus/CLAUDE.md](../../CLAUDE.md)).

## Context

`npm run test:e2e` fails now and then on a cold deep link when the machine is loaded: the share-link alias in `e2e/place.spec.ts` (near line 75) and `e2e/signed-in.spec.ts` (near line 58). The suite serves the UI with `vite dev`, which transforms each route's modules on the first request, so the first page load of a route waits on Vite and can run past the spec's timeout. It predates the shareable-links brief (measured 2026-11-12: baseline 38/38 once and one failure the next run; stress run of four specs three times gave 3 failures).

A build has no on-demand transform, so serving `vite preview` of a production build removes the cause instead of hiding it behind longer timeouts or a warm-up that can miss a route. `vite preview` reuses `server.proxy`, so `/prm-api` still reaches the test backend, and its SPA fallback serves deep links under `/prm/`.

## Files you OWN

- `playwright.config.ts`
- the corpus pages that describe the e2e run (`corpus/wiki/status.md` line for the harness), `corpus/log.md`

## Files you must NOT touch

- every spec under `e2e/`, including the date-dependent bell spec (a known separate bug), and `e2e/fixtures.ts`
- `ui/` and `backend/` source, `vendor/`

## What to do

1. In `playwright.config.ts`, change the UI web server's command from `vite dev` to a production build followed by `vite preview` on the same port with `--strictPort`. The build runs with `PRM_BASE=/prm/` and `VITE_API_URL=/prm-api`, so the bundle matches what the specs expect. Keep the readiness URL and a timeout that covers the build.
2. Do not raise any test timeout.
3. Update the comment block at the top of the config and the corpus's one-line description of the harness (it serves a build, not the dev server). Add a `log.md` entry.

## Acceptance

- `npm run check` exits 0.
- The full Playwright suite with `--workers=2`, run twice in a row, shows the cold deep links (`place.spec` share-link alias, `signed-in` archive) passing both times. Failures left over, if any, are named and are not cold-load timeouts.
- `bash corpus/lint.sh` exits 0.
