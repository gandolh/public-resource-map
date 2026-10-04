# TP-05 — Sign-in and the admin gate (Ward)

Needs the local Ward (`localhost:8792`; the dev server proxies `/ward` to it)
and two Ward accounts: one holding `prm:admin` and one without it. Credentials
live outside the repo, in `~/.config/ward/local.env`, and are never written
into a plan, a result or a screenshot name.

## Goal

prm keeps no accounts. Ward signs people in, and prm reads Ward's session
cookie and `prm:*` grants. This plan proves the round trip and the gate.
Registering, verifying and resetting a password are Ward's own pages, and Ward
tests them, not this plan.

## Cases

1. **Log in returns here.**
   - From any page, Log in (and Create account) goes to Ward with that page as
     `next`, and comes back to it signed in.
   - The navbar shows the person, and `GET /prm-api/api/me` answers their
     subject.
   - e2e `sign-in.spec › Log in and Create account return to the page …` (the
     link); **manual** for the round trip.
2. **Log out** ends the session at Ward and the navbar shows Log in again. The
   next `GET /api/me` answers `{"user": null}` (200, never cached). **Manual** (watch the open Ward sign-out issue in
   the `local-ward-container` notes).
3. **Signed out, the API refuses** personal and admin routes with 401 before
   asking Ward anything.
   - api `favorites.api.test › favourites › need a signed-in person`
   - api `admin-osm.api.test › 401s an anonymous request`
   - api `admin-ingest.api.test › the admin gate`
4. **The admin gate.**
   - Signed out, `/prm/admin` asks for sign-in and returns there afterwards.
     e2e `admin.spec › a signed-out visitor at /admin is asked to sign in, …`.
   - Signed in without `prm:admin`, it shows "no access" and the API answers
     403. api `admin-osm.api.test › 403s a non-admin user`; e2e
     `signed-in.spec › a signed-in person without the admin grant is told so …`.
   - With the grant, it shows the review queue and the sources. e2e
     `signed-in.spec › an admin reaches the review queue and the sources`.
5. **Ward down.** Stop Ward. `/api/me` is 503, not "signed out", and the
   public map still works.
   api `ward.plugin.api.test › Ward plugin: key set unreachable` (3 tests).
6. **Token handling** (prm's half of auth): JWKS failures, `alg: none`,
   key-confusion, issuer/audience/expiry, introspection and its cache, the
   cookie. api `ward.client.test` (30 tests).

## Pass criteria

- The api and e2e tests named are green.
- Manual cases 1, 2 and the page side of 4 behave as described against the
  local Ward.
