# Brief 18 — Guard the anonymous write routes on places and events

> Written 2026-09-27 from the [improvements audit](../../todos/2026-09-27-improvements-audit.md) (#1). Independent. **Build first** — it is the only finding exploitable from the public internet today.

## Context

Four mutating routes are registered on the public app with no guard:

| Route | Where |
|---|---|
| `POST /api/places` | `backend/src/routes/places.ts:186` |
| `DELETE /api/places/:id` | `backend/src/routes/places.ts:201` |
| `POST /api/events` | `backend/src/routes/events.ts:79` |
| `DELETE /api/events/:id` | `backend/src/routes/events.ts:93` |

Guards are opt-in per route (locked — [decisions.md → Identity is Ward's](../../wiki/decisions.md)); the root Ward hook grants nothing. So these four are open to anyone. Nothing in the UI calls them (`ui/app/lib/api.ts` only issues GETs) and no test exercises them. They are left over from the original CRUD API.

**Failure scenarios**
- `curl -X DELETE <api-origin>/api/places/<id>` from anywhere deletes a place. Walking `GET /api/places?pageSize=1000` gives every id, so every place with no events can be wiped. A place that still has events answers **500**: `event.place_id` has no `ON DELETE` and `foreign_keys=ON`, so the FK error escapes as an unhandled error instead of a refusal.
- `POST /api/events` defaults `status` to `live` (`shared/src/types/event.ts:47`). Anyone can put an arbitrary event on any place, bypassing the locked admin review gate ("only accepted events are persisted as live") and the legal posture. That includes a "Buy tickets" link to any https URL, rendered on the trusted origin: a phishing vector. (`buyUrl` is `z.string().url()`, which also accepts `javascript:`. React 19 blocks those hrefs at render, so the live risk is phishing, not script.)

## Decision taken here

**Keep the routes, gate them with `requireAdmin`.** They are a useful escape hatch for manual fixes by curl until brief 16's admin UI exists. Deleting them outright is the alternative; nothing depends on them.

## Files you OWN
- `backend/src/routes/places.ts` — the `POST /places` and `DELETE /places/:id` handlers only
- `backend/src/routes/events.ts` — the `POST /events` and `DELETE /events/:id` handlers only
- `backend/src/routes/writes.api.test.ts` (new)

## Files you must NOT touch
- `backend/src/ward/**` — the guards are correct; this brief only applies them.
- The GET handlers in `places.ts` / `whats-on.ts` / `events.ts` (briefs 19 and 20 change those).
- `shared/src/types/*.ts` — tightening URL schemes is a watch item in the audit, not this brief.

## What to do
1. Add `{ preHandler: app.requireAdmin }` to the four handlers, the same shape as `backend/src/routes/admin-osm.ts:17-20`.
2. `DELETE /api/places/:id`: if the place is still referenced (by `event`, `staged_event`, `favorite_place`, `notification`), answer **409** `{ code: "PLACE_IN_USE" }` instead of letting the FK error become a 500. Do the same for `DELETE /api/events/:id` (referenced by `staged_event`, `favorite_event`, `notification`, `notification_event`). You can check before deleting, or catch `SQLITE_CONSTRAINT_FOREIGNKEY` and map it. Either is fine; say which in the log.
3. Tests in the new file, using `buildTestApp()` and the `loginAs(role)` helper pattern from `backend/src/routes/admin-osm.api.test.ts:23-27`. Simulate an unreachable Ward with `t.ward.breakWith(new WardUnavailableError("down"))` (see `backend/src/test/fake-ward.ts`).

## Acceptance
- For each of the four routes: anonymous → 401; `prm:user` → 403; Ward unavailable → 503; `prm:admin` → 201 / 204.
- `DELETE /api/places/:id` on a place that has an event → 409, and the row is still there.
- Every existing test passes untouched (no GET behaviour changed).
- `npm test` and `npm run typecheck` green.
- `corpus/wiki/architecture.md` API table notes the four routes are admin-only.
