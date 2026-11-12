---
title: Cold deep links time out in the e2e suite on the dev server
created: 2026-11-12
status: open
---

# Cold deep links time out in the e2e suite on the dev server

`npm run test:e2e` fails now and then on a cold deep link, under load on the dev server. The failing tests are `place.spec` around line 75, the share-link alias, and `signed-in` around line 58. The first page load times out before the view settles.

It predates brief 01, measured on 2026-11-12 on the same machine:

| Run | Baseline (`31c21ad`) | After brief 01 |
|---|---|---|
| Full suite | 38/38 once, one failure the next time (`signed-in:58`) | 44/44 once, 41/44 the next time |
| Stress run, four specs × 3 | 3 failures | 3 and 5 failures |

The first map URL writer navigated the router on every change and made the failures much worse (12 of 54). Writing with `history.replaceState` (`5bc974a`) brought the rate back to about the baseline.

Worth checking:

- whether the timeouts come from Vite's first transform of a cold route. If so, a warm-up visit or running the suite against `vite preview` would settle it;
- the specs' first-load timeout.
