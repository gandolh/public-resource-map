# Brief 30 — Ask Ward only on the routes that need a user

> Written 2026-10-06. The owner answered the open question "Ward on the public path for signed-in visitors": resolve the session lazily.

## Context

`backend/src/ward/ward.plugin.ts` resolves the Ward session in a **root** `preHandler`
whenever the request carries a `ward_session` cookie. That cookie is estate-wide
(`Path=/` on the shared origin), so anyone signed in to any estate app sends it to
prm. Every public request from them then waits on Ward's verification and
introspection: cached for 30 s, with the key set re-fetched every 10 minutes and a 5 s
timeout. A refusing Ward fails fast. A **slow** one adds up to 5 s to public-map
requests. The design says "the public map never asks Ward anything"; today that
is true only for anonymous visitors. Found by the
[2026-09-27 audit](../../todos/2026-09-27-improvements-audit.md).

Only four places read the session: `requireAuth` and `requireAdmin` (the plugin's
guards), `routes/me.ts`, and the two guarded routes `favorites.ts` and
`archive.ts`, which read `req.ward!.subject` after a guard ran.

## Files you OWN
- `backend/src/ward/ward.plugin.ts`
- `backend/src/routes/me.ts`
- The Ward plugin's tests, and any route test that asserts on Ward call counts
- `corpus/wiki/decisions.md` (the locked "root preHandler" mechanism is revised here), `corpus/wiki/open-questions.md`, `corpus/log.md`

## What to do
1. Remove the root `preHandler`. Add one function that resolves the session for a
   request, at most once per request (memoize on the request), with the same
   cookie-presence short cut and the same error handling: an authentication
   failure means anonymous; `WardUnavailableError` sets `wardUnavailable` and logs
   at error level; anything else throws.
2. `requireAuth` and `requireAdmin` call it first, then decide exactly as now: 503
   when unavailable, 401 anonymous, 403 without the grant.
3. `/api/me` calls it directly, since it answers for anonymous visitors too.
4. Keep `req.ward` and `req.wardUnavailable` as the fields guarded handlers read,
   so `favorites.ts` and `archive.ts` don't change.
5. Revise the decision in `decisions.md` (date, what changed, why), delete the
   open question, log it.

## Acceptance
- A test with a `ward_session` cookie and a stub Ward client that never resolves:
  `GET /api/places` (and the other public reads) answer normally and the stub is
  never called.
- The same stub on a guarded route still answers 503 when it throws
  `WardUnavailableError`, 401 without a cookie, 403 without the grant.
- One request through a guard and `/api/me`-style reuse calls Ward at most once.
- `npm test` and `npm run typecheck` pass.
