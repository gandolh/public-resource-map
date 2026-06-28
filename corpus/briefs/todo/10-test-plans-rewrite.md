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
