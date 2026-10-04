# Decisions — identity

Split out of [decisions.md](decisions.md) on 2026-10-04, when that page passed ~200 lines (corpus/CLAUDE.md). Unchanged in the move. Same rule: a change needs an explicit revisit and a `log.md` entry.

## Auth (locked 2026-06-28 — **SUPERSEDED 2026-09-06, see "Identity is Ward's" below**)

> Every bullet in this section describes machinery prm no longer has. It is
> kept because the *reasoning* still explains why prm has end-user accounts at
> all, which the replacement inherited unchanged; only the implementation moved.

- **Full end-user auth is in scope now** (not deferred), because favorites + notifications are the **retention loop the POC is meant to demonstrate** — not just admin gating. (Re-confirmed 2026-06-28 against the POC reframe: kept deliberately, as a demoed feature.)
- **Email + password, self-hosted** — matches the house style of hand-rolling over dependencies (better-sqlite3, no UUID lib, Zod). No managed provider (Clerk/Auth0) for v1.
- **Hashing: argon2id** (or bcrypt) — never plaintext/SHA.
- **Sessions: opaque session id in an httpOnly + Secure + SameSite cookie**, stored server-side in SQLite. **Not** a JWT in localStorage (XSS-stealable). Use `@fastify/cookie`.
- **Verify + reset flows are built now**, but email delivery is **console-logged links in dev**; swap in a transactional email provider (Resend/Postmark/SES) before launch.
- The Navbar profile dropdown is currently **decorative**; it becomes real when auth lands.

## Identity is Ward's (locked 2026-09-06 — supersedes "Auth" above)

- **prm authenticates nobody.** The `user`, `session`, `verification_token` and
  `reset_token` tables are dropped; `plugins/auth.ts`, `routes/auth.ts`,
  `lib/auth-internals.ts`, `lib/ensure-admin.ts` and the login/register screens
  are deleted. prm holds **no credential of any kind** — no password hash, no
  session id, no reset token. Sign-in, registration, email verification and
  password reset are [Ward's](../../../wzd_auth/corpus/wiki/overview.md), at one
  login page for the estate.
- **prm is the reason Ward has public registration at all.** The estate's first
  design had no self-signup; prm ships it, and that collision is what moved the
  security boundary from *registration* to *authorization*. Anyone may hold a
  Ward account; a **grant** is what lets them reach anything. prm's app row is
  the only one in the estate with `public_registration` on, and registering at
  `/ward/register?app=prm` confers exactly `prm:user` and nothing anywhere else.
- **Roles became grants.** `user.role` is gone. Authority is the Ward triple
  `(subject, "prm", role)`; Ward stores it and never interprets it. `requireAuth`
  now means *holds a prm grant*, not merely *has a session* — a live Ward
  account with no prm grant is not signed in as far as prm is concerned, which
  is exactly what keeps open registration here from opening atrium.
  **`prm:admin` does not imply `prm:user`**: grants are a set, not a ladder, so
  `requireAuth` accepts either explicitly rather than assuming a hierarchy Ward
  does not have.
- **`emailVerified` was never prm's.** It is an account-level fact, not an
  app-level one, and Ward records it once instead of every app recording it
  separately.
- **Per-person rows are re-keyed onto the subject.** `favorite_place`,
  `favorite_event` and `notification` swap `user_id` for `subject` — an opaque
  Ward identifier, with **no foreign key**, because the table it would reference
  does not exist here and a local `user` table would be a second, stale answer
  to "who exists".
- **Nothing is gated by default, and that is deliberate.** Every other app in
  the estate gates its whole surface; prm is a *public resource map* and does
  the opposite. The root hook resolves a session only when a cookie is present
  and leaves the request anonymous otherwise; `requireAuth`/`requireAdmin` stay
  opt-in per route. A consequence worth keeping: **when Ward is down, the public
  map still works**, because it never asks Ward anything. Guarded routes answer
  503 and fail closed. "Ward is down" includes **Ward's key set being
  unreachable** (brief 21, 2026-10-03): a failure to fetch or read the JWKS is
  `WardUnavailableError`, not an invalid token; only "no key matches this
  token's `kid`" stays a 401. The client's injected `fetch` reaches the key set
  too (`jose`'s `customFetch`), so tests cover that path.
- **prm hand-writes its Ward client** (`backend/src/ward/`) rather than
  importing a shared package — the estate decided against one because these
  repos are separate checkouts that `npm ci` independently. The contract is
  `wzd_auth/corpus/wiki/integrating.md`.
- **There is no seeded admin.** `ensureAdmin` promoted an account from
  `ADMIN_EMAIL`/`ADMIN_PASSWORD` on every boot; `prm:admin` is now issued by
  hand from Ward's console. An admin a redeploy can recreate is an admin an
  environment variable can silently grant.
- **The cutover destroys every account and everything keyed on one** — the
  favourites and notifications go with them. prm keyed people on **email** and
  Ward keys them on a minted subject, so no mapping exists that was not invented
  at cutover time; the estate chose a full prune. Places, events, sources and
  the geocode cache are untouched. **Take a database copy first** — `0001_ward_cutover.sql`
  has no down.
