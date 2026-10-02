# Brief 26 — A test suite for prm's real Ward client

> Written 2026-09-27 from the [improvements audit](../../todos/2026-09-27-improvements-audit.md) (#9). **Depends on 21**, which creates `ward.client.test.ts` and threads the injected fetch into the JWKS fetch. Extend that file; do not start a parallel one.

## Context

`backend/src/ward/ward.client.ts` (279 lines) is security code: algorithm pinning, issuer/audience/claims checks, the 30-second introspection cache, in-flight collapsing, cookie parsing and the fail-closed status mapping. Its own header says it is "security code, written five times across the estate", adapted by hand from `wzd_auth/client/src/`.

**No test touches it.** Every API test builds the app with `test/fake-ward.ts`, which implements the client *interface* and resolves sessions from a map. The real guards are exercised, which is good, but not one line of the real client. Ward's reference has 34 test cases across `verify`, `introspect`, `cookie` and `client` (`wzd_auth/client/src/*.test.ts`, 815 lines); the adaptation carries none of them.

**What would ship undetected today:**
- dropping `algorithms: [ACCESS_TOKEN_ALG]` (`ward.client.ts:145`) reopens `alg` confusion (`none`, or HS256 keyed with the public key)
- a wrong `issuer`/`audience`, or a lost `requiredClaims`, accepts tokens meant for someone else
- a cache keyed by subject instead of token, or a TTL raised past 30s, silently weakens revocation (the number "the whole revocation design rests on", `ward.types.ts`)
- mapping a Ward 500 to "inactive" instead of unavailable breaks fail-closed
- `readCookie` returning `""` for a cleared cookie turns every signed-out request into a verification error

## Files you OWN
- `backend/src/ward/ward.client.test.ts` (extend the file brief 21 creates)

## Files you must NOT touch
- `backend/src/ward/ward.client.ts`. This brief only adds tests. If a test exposes a real bug, stop, record it in the log, and raise it rather than fixing it here.
- Anything in `../wzd_auth`. Read its tests as a reference; do not import from it (the no-shared-package decision in `ward.types.ts`).

## What to do
Port the relevant cases from the reference suites, adapted to prm's single `createWardClient` shape. Use a real EdDSA key pair (`generateKeyPair("EdDSA")`), tokens from `SignJWT`, and the injected `fetch` serving both the JWKS and `/introspect`. Use the `now` option for cache timing (no sleeps). At minimum:

- **verify:** valid token passes. Rejected: `alg: none`; HS256 signed with the public key's bytes; wrong `iss`; wrong `aud`; missing `sid`; expired beyond the 5s tolerance. Accepted: expired within the tolerance.
- **introspect:** 200 active → session; 200 inactive → `{active:false}`; 401 → `WardConfigurationError`; 500 → `WardUnavailableError`; non-JSON body → unavailable; active without subject → unavailable; timeout (a fetch that never settles, with a short `introspectTimeoutMs`) → unavailable.
- **cache:** two calls inside 30s → one fetch; the same call after 30s → a second fetch; two different tokens → two fetches; concurrent calls for one cold token → one fetch.
- **cookie:** absent header, empty `ward_session=`, several cookies, array header, a name that merely contains `ward_session`.
- **authenticate:** inactive session → `WardAuthenticationError`; app-key header present on the introspection request.

## Acceptance
- All the cases above pass, with no network (the injected fetch only).
- Sanity check: temporarily removing `algorithms` from `jwtVerify`, or setting the cache TTL to 60s, makes at least one test fail. Say which in the log, then restore.
- `npm test`, `npm run typecheck` green.

## Outcome (2026-10-03)

Every listed case is ported and passes with no network (30 client tests). Sanity: a 60s TTL fails the 30-second test. Removing `algorithms` fails the `alg: none` and HS256 tests, which see a 503-class error instead of a 401, not an acceptance; see the log for why, and for the small hardening suggestion it implies for the client, which this brief may not touch. One support file changed beyond the brief's list: `test/real-ward.ts`, so handlers can see the request init.
