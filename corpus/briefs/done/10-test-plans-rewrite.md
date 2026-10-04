# Brief 10 — Test plans: rewrite for place-centric model + new-feature coverage

> Written 2026-06-28. Depends on **brief 08** (RO seed — tests assert against it) and the feature briefs they cover. Keeps the locked testing model (assertion-based Playwright on a seeded deterministic DB + thin Vitest for auth internals).

## Goal

Replace the stale, event-centric test plans (TP-01–04 test separate `/events` + a resource-detail page that no longer exist as such) with plans matching the **place-centric** product, and add plans for the new features (auth, favorites, notifications, admin ingestion).

## Rewrite existing plans

- **TP-01 Map** → place-centric: place pins colored by category, event-presence badge, place-panel-on-click with the place's events + buy-links, city picker switching T/B, works without geolocation.
- **TP-02 "What's on"** → the reframed citywide event index linking back to places (was the standalone events grid).
- **TP-03 Place detail** → the unified place surface via deep link (was resource-detail).
- **TP-04 UI audit** → re-run design-fidelity/a11y/responsive against the new UI; **add attribution presence checks** (brief 09).

## New plans

- **TP-05 Auth** — register → verify (console link) → login → me → logout; reset flow; admin gate rejects non-admins.
- **TP-06 Favorites & notifications** — favorite a place → admin accepts an event there → bell shows unread + (email console-logged); favorite an event tomorrow → run reminder sweep → exactly one reminder (idempotent on re-run); Bucharest-TZ day boundary.
- **TP-07 Admin ingestion** — refresh a source → diff of new/changed/stale → accept/reject (bulk) → only accepted go live → ambiguous-match + manual-pin + needs-attention buckets behave; `suspect` flag on 0/big-drop.

## Updates to the harness

- Switch geolocation mock from NYC → a Timișoara/București default (brief 08).
- Update `test-plans/index.md` catalog + the run procedure; refresh `RESULTS.md` on the next run.
- Keep screenshots out of git (existing convention).

## Acceptance criteria

- No test plan references NYC, the old standalone `/events`, or the old resource-detail model.
- Plans exist and pass for: place-centric map, what's-on index, place detail, auth, favorites/notifications (incl. reminder idempotency), admin ingestion.
- Attribution presence is asserted.
- Vitest auth-internals suite (hashing, single-use tokens, session expiry) is present and green.

## Outcome (2026-10-04)

The plans were rewritten and the run was walked. It found six bugs, all fixed
here, and one Ward-side failure that stays open.

- **Plans** (`corpus/test-plans/`):
  - TP-01 map, TP-02 what's on, TP-03 place and TP-04 UI audit were rewritten
    for the place-centric UI. TP-04 now includes the attribution checks.
  - New: TP-05 sign-in and the admin gate, TP-06 favourites and
    notifications, TP-07 admin ingestion.
  - Every case names the test that covers it (e2e spec, api test) or says
    **manual**. Most cases are automated, so the plans hold what e2e cannot
    reach (Ward sign-in) and what needs eyes.
  - `index.md` has the run procedure: automated gates, then a manual walk on a
    scratch database against the local Ward, with credentials kept out of the
    repo.
  - No plan mentions NYC, `/events` or `/resources/:id`.
- **Scope changes forced by Ward:**
  - **TP-05 is not "register → verify → reset".** Those are Ward's pages and
    Ward's tests. prm's half is the round trip, the gate, and token handling
    (`ward.client.test`, 30 tests; `ward.plugin.api.test`).
  - **The "Vitest auth-internals suite (hashing, single-use tokens, session
    expiry)" is obsolete.** prm hashes nothing and issues no tokens since the
    cutover. Its equivalent is the Ward client suite above.
  - **No "email console-logged"** in TP-06: email is blocked on Ward
    (decisions.md).
- **The run** ([RESULTS.md](../../test-plans/RESULTS.md)):
  - TP-01, 02, 03, 06 and 07 pass.
  - TP-04 passes with findings, and was walked only in part.
  - TP-05 **fails on Ward's side**: Ward's Sign out does not end the session
    (the known bug).
  - The non-admin page was not walked, since there is only one local Ward
    account.
- **Fixed from the run:**
  - **F-01:** pins were unnamed buttons, and clusters were named by a digit.
    Now the inner markup is `aria-hidden`, and the titles read "Place · N
    events" or "N places — zoom in".
  - **F-02:** Enter or Space on a focused pin did nothing, because Leaflet
    only answers Enter for popups. A keydown handler now opens pins and zooms
    clusters.
  - **F-03:** a wrapped event row left its "·" dangling. The row now stays on
    one line and the place truncates.
  - **F-04:** the review drawer's candidate buttons were indistinguishable.
    They are now named "Use <place>".
  - **F-05:** the navbar's Log in and Create account always returned to the
    map. They now pass the current page as `next`.
  - **F-06:** the iCal category guesser matched stems inside words
    ("matched" became Sport). Stems now match from a word start.

**Tests:**
- 3 new e2e specs: pin names, keyboard open and close, and the sign-in return.
  The first two and the sign-in spec fail without their fixes.
- 2 new guessCategory tests.
- `npm test` 176, e2e 20, typecheck clean.
