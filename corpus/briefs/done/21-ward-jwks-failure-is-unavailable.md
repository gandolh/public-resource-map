# Brief 21 — Ward: a JWKS fetch failure means "unavailable", never "signed out"

> Written 2026-09-27 from the [improvements audit](../../todos/2026-09-27-improvements-audit.md) (#4). Independent. Brief 26 builds on the test file this one creates.

## Context

prm's locked rule: when Ward cannot be reached, guarded routes and `/api/me` answer **503**, and nobody is told they are signed out ([decisions.md → Identity is Ward's](../../wiki/decisions.md); `request.wardUnavailable` exists for exactly this). Ward's contract says the same, as rule 5: *"never let any of them resolve as 'not signed in'"* (`wzd_auth/corpus/wiki/integrating.md`).

It only holds for the introspection call. `verify()` (`backend/src/ward/ward.client.ts:134-156`) wraps **every** `jwtVerify` failure as `WardAuthenticationError`, including failures to *fetch the key set*. `jose`'s remote key set re-fetches whenever its cache is older than `cacheMaxAge` (10 minutes here) or empty (`node_modules/jose/dist/webapi/jwks/remote.js`, `remoteJWKSet`). So once Ward has been down for more than 10 minutes, or right after prm restarts:

`ward_session` cookie → `verify()` → JWKS fetch fails → `WardAuthenticationError` → root hook swallows it silently (`backend/src/ward/ward.plugin.ts:195-205`) → `req.ward = null`, `wardUnavailable` unset.

**Reproduced 2026-09-27:** a client pointed at a closed port, given a well-formed EdDSA token, throws `WardAuthenticationError` (cause `TypeError: fetch failed`) and never reaches introspection.

**Consequences.** `GET /api/me` answers `{ user: null }`, and the UI tells a signed-in person they are signed out and offers a login page that cannot work either. Admin routes answer 401 instead of 503. **Nothing is logged**: the "ward is not answering" error only fires for `WardUnavailableError`, so the operator gets no signal at all. Both answers still refuse, so nothing is exposed; the wrong signal is the bug.

The injected `fetch` option (`ward.client.ts:57`) does not reach the key set: `createRemoteJWKSet` uses global `fetch` unless given `jose`'s `customFetch` symbol. So no test can exercise this path today.

Ward's reference client (`wzd_auth/client/src/verify.ts`) has the same catch-all. Fix prm here, and tell the Ward owner separately. Do **not** edit `wzd_auth`.

## Files you OWN
- `backend/src/ward/ward.client.ts`
- `backend/src/ward/ward.client.test.ts` (new)
- `backend/src/ward/ward.plugin.api.test.ts` (new): plugin-level regression through `buildApp`

## Files you must NOT touch
- `backend/src/ward/ward.plugin.ts` — its classification logic is right once the client throws the right error.
- `backend/src/ward/ward.types.ts` — the error classes already fit.
- Anything under `../wzd_auth`.

## What to do
1. Pass the injected fetch to the key set: `createRemoteJWKSet(url, { …, [customFetch]: fetchImpl })` (`import { customFetch } from "jose"`). One seam then covers both calls.
2. Wrap the key resolver handed to `jwtVerify`. An error thrown **while resolving the key** becomes `WardUnavailableError("jwks unavailable", { cause })`. The exceptions are `JWKSNoMatchingKey` and `JWKSMultipleMatchingKeys`: those describe the *token* and stay authentication errors. Everything else from the resolver (`JWKSTimeout`, the generic `JOSEError` for a non-200 or non-JSON JWKS, `JWKSInvalid`, a raw `TypeError`/abort from fetch) means Ward is broken or unreachable.
3. In `verify()`'s catch, rethrow a `WardUnavailableError` unchanged; wrap everything else as today.
4. Leave a comment naming Ward contract rule 5 beside the wrapper, in the style of the file's other "must get right" comments.

## Acceptance
Client tests (generate an EdDSA key pair with `jose`'s `generateKeyPair`, sign with `SignJWT`, serve the JWKS and `/introspect` from the injected fetch):
- JWKS fetch throws → `authenticate` rejects with `WardUnavailableError`.
- JWKS answers 500 → `WardUnavailableError`.
- Valid token, JWKS OK, introspection active → resolves the caller.
- Token signed by a key that is not in the JWKS → still `WardAuthenticationError`.

Plugin test (`buildApp({ db, ward: createWardClient({ …, fetch }) })`, JWKS failing):
- `GET /api/me` with a cookie → **503** `IDENTITY_UNAVAILABLE`.
- `GET /api/places` with the same cookie → **200**. The public map is unaffected.
- `POST /api/admin/osm/sync` with the cookie → 503.

`npm test`, `npm run typecheck` green.

## Outcome (2026-10-03)

Done as specified. `ward.client.ts` passes `[customFetch]: fetchImpl` to `createRemoteJWKSet` and wraps the key resolver: anything but `JWKSNoMatchingKey`/`JWKSMultipleMatchingKeys` becomes `WardUnavailableError("jwks unavailable", { cause })`, and `verify()` rethrows that class unchanged. A contract-rule-5 comment sits beside the wrapper. All seven acceptance tests pass, and they were confirmed to fail with the client change reverted. One file beyond the brief's list: `backend/src/test/real-ward.ts` holds the key, token and fake-Ward-fetch helpers both test files share, since importing them from a `.test.ts` would re-run that suite. Ward's reference client has the same flaw and is untouched. That was reported to the owner in the run summary.
