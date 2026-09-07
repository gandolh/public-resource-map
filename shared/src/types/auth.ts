/**
 * The auth contract is gone (2026-09-06).
 *
 * `publicUserSchema`, `registerSchema` and `loginSchema` described a wire
 * contract prm no longer has: it authenticates nobody, holds no credential, and
 * renders no login or registration form. Identity is Ward's, and the browser
 * proves it with a cookie rather than a body this package would have to
 * describe.
 *
 * Two of the fields those schemas carried moved rather than vanished, and where
 * they went is the point:
 *
 *  - **`role`** became a Ward **grant** — the triple `(subject, "prm", role)`.
 *    prm reads it, Ward never interprets it. It is what lets prm keep public
 *    registration open without that registration conferring anything in atrium.
 *  - **`emailVerified`** was always an account-level fact rather than an
 *    app-level one, and is now recorded once by Ward instead of once per app.
 *
 * The narrow shape prm's own UI needs — subject, username, `isAdmin` — is
 * `PrmUser` in `ui/app/lib/authApi.ts`. It is deliberately **not** here: it is
 * not a contract between two packages, it is one route's response, and putting
 * it in `shared` would invite the backend to grow a second opinion about what
 * "signed in" means.
 *
 * This file is kept as a signpost rather than deleted, so that the next person
 * looking for `LoginInput` finds this explanation instead of a blank.
 */

export {};
