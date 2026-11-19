# Brief 08: Linking Ward asks for the password, and a username can change

**Depends on:** Ward's library at the version that adds the look-alike username check (2026-11-19; the dispatch prompt names the wzd_auth commit to vendor from).

**Before you start:** run `brief-board guide` (the repo's `CLAUDE.md` says so).

Filed 2026-11-19 by the controller. The owner's rule of 2026-11-17: an app links or unlinks a Ward account only after the local password is typed again. Ward's library carries the rule from 1.0.0; this app gets it when it vendors the new copy. The same update refuses a new or changed local username that looks like an existing one (Unicode's confusable skeleton: `AIice` against `alice`, `b0b` against `bob`). The owner's answer of 2026-11-19: apps that pass 0.4.0 on this update keep its rename route and get a screen for it.

## Context

This app vendors ward-auth 0.3.1 in `backend/vendor/ward` and `ui/vendor/ward`. Its code calls the link and unlink at: `ui/app/routes/settings.tsx:194` (link), `:189` (unlink); `backend/src/plugins/auth/auth.api.test.ts:216`.

What the update changes here:

- `POST /ward/link` and `POST /ward/unlink` take `{ currentPassword }`: 400 `invalid_request` without it, 401 `invalid_credentials` when it is wrong, 429 `too_many_attempts` with `retryAfterSeconds` under the change-password budget. A Ward-only user still gets 409 `no_local_password` on unlink, whatever is sent.
- The browser calls take the password: `link(currentPassword)` / `startWardLink(currentPassword)`, `unlink(currentPassword)` / `unlinkWard(currentPassword)`. The old call shape no longer compiles, so the typecheck finds every call site.
- A link start is held in the server's memory for ten minutes; one still waiting for Ward when the server restarts lands as `?ward_error=invalid_callback` (the words for it exist).
- The username key: a migration at start adds a key column and fills it. Two existing accounts with the same key are both kept and logged once. Nothing to do by hand.
- On the way from 0.3.1: 0.4.0 (the rename route, on by default), 0.5.0 (`usernameFor`), 0.6.0 (migration 4 and disabling an account) and 0.7.0 (`returnTo`). Read each CHANGELOG entry and do what it asks of an app.

## Decisions

- **Both copies in one commit.** The new server copy refuses a link or unlink from an old web copy (400); an old server ignores the new field.
- **The password field sits with its control:** next to each button. Labelled as the app labels its other password fields ("Current password" or the app's language), `type="password"`, `autocomplete="current-password"`. A refusal stays on the page: `invalid_credentials` and `too_many_attempts` (with the wait) show beside the field, which keeps focus.
- **A username can change** (the owner, 2026-11-19). The rename route stays on (the library's default since 0.4.0; no `allowRename: false`), and the account settings get a Change username field: `useRenameUser()` / `renameUser(next)`, showing `username_taken` (a look-alike answers the same), `invalid_username` and `too_many_attempts`. Shelfmark's Change username screen is the model.
- **Before the screen, check what is keyed by the name.** Find what this app stores or matches by username (seeds, saved rows, links, streams, mentions). If stored data is keyed by the name, a rename would cut it off: set `allowRename: false` instead, file a todo naming what is keyed, say so in the report, and skip the screen.
- Open sign-up is live here, so the look-alike check matters most in this app: test it on `/register` too.

## Files you OWN

- `backend/vendor/ward/` and `ui/vendor/ward/`: generated, written only by Ward's vendor script.
- The settings code named above, the server's auth plugin options, and their tests; the new Change username component.
- Corpus: `corpus/wiki/status.md`, `corpus/log.md`, the wiki page that describes sign-in.

## Files you must NOT touch

- The wzd_auth repo: read only (its vendor script writes only into this repo). Other features.

## What to do

1. Vendor both copies from the wzd_auth checkout at the commit the dispatch prompt names: `npm run vendor -- <this repo>/backend/vendor/ward`, then the same for `ui/vendor/ward`, in one commit with the call-site changes.
2. Server tests that POST `/ward/link` or `/ward/unlink` with a session send `{ currentPassword }`. New: link and unlink without it, with a wrong one and with the right one; a linked user still signs in with Ward.
3. The settings UI as decided, with a test that the call carries the password and that a wrong one shows the message.
4. The username check and then the screen (or the todo), as decided. Tests: a rename works and signs in under the new name; a taken name and a look-alike (`AIice` when `alice` exists) answer `username_taken`.
5. Start the app on its dev seed once and read the start log: the username-key migration ran; note any shared-key line.
6. Shots of the settings at 1280 light and 390 dark; read them for clipping.

## Acceptance

- [ ] Both vendored copies at the new version; the tests above pass; `npm run check` exit 0; `bash corpus/lint.sh` OK.
- [ ] The outcome note lists each CHANGELOG entry this app crossed and what it needed, and the username check's finding.
- [ ] End move `ready_for_deploy` with the app's deploy step (server and web both change).

## Outcome (2026-11-19)

Built in commit `acdaeba`. Both vendored copies (`backend/vendor/ward`, `ui/vendor/ward`) went from 0.3.1 to ward-auth 1.1.0 (six files each, checked against the staged copy's `SHA256SUMS`).

**CHANGELOG entries crossed, and what each needed**

- 0.4.0, rename route on by default: kept on (no `allowRename: false`). Nothing in prm is keyed by the username: favourites, notifications and reminders hold the user id, and `subjects.ts` only uses names as placeholders. The Change username form is new (`ui/app/components/auth/ChangeUsername.tsx`). The demo seed finds its user by name, so renaming that user and reseeding makes a second one; the library's note says the same.
- 0.5.0, `usernameFor`: nothing needed; prm keeps the default.
- 0.6.0, migration 4 and disabling a user: nothing needed; the migration ran by itself and prm never calls `disableUser`.
- 0.6.1, exports: nothing.
- 0.7.0, `returnTo` after a refused sign-in: nothing needed; the login page keeps its own `next` handling.
- 0.7.1, 0.7.2: no change for apps.
- 1.0.0, password on link and unlink: a field beside each button (`ui/app/components/auth/WardLink.tsx`), the tests send `{ currentPassword }`. A Ward-only user keeps the "set a password first" notice and no field.
- 1.1.0, look-alike usernames, migration 5: nothing by hand.

**The username check's finding.** `/register` and the rename answer `409 username_taken` for `AIice` beside `alice`, a Cyrillic `аlice` and `b0b` beside `bob`; the register page already shows that code. Side effect worth knowing: the dev seed's `demo` reads as `derno` (rn for m), so a person named `dern0` or similar would be refused beside it.

**Start log.** On a fresh dev seed the server's start log has no username-key line (the library warns only when users share a key); `auth_migrations` shows version 5 `username_skeleton` applied and `demo` keyed `derno`. A throwaway copy with two hand-inserted users `alice` and `AIice` logged: `ward-auth: 2 users have usernames that read the same (ids u-a, u-b). They stay as they are, and no new user or rename can take that name. If they are not one person, rename one of them.` Run it against production's database copy before the deploy to see whether any real pair exists.

**Tests.** Server (`auth.api.test.ts`): link and unlink without the password (400), wrong (401), right (200 and the user still signs in locally), Ward-only unlink (409), signed-out (401), Ward off (404); a rename works and signs in under the new name; taken, case-different and look-alike names answer `username_taken`; a look-alike on `/register`. UI (`WardLink.test.tsx`, jsdom): the call carries the typed password, a wrong one shows its message with focus back on the field, `too_many_attempts` shows the wait, a Ward-only user gets no field. `npm run check` exit 0 (328 tests).

**Shots** (settings at 1280 light and 390 dark, link and unlink, refusals showing, Ward and session routes stubbed): read, no clipping or horizontal overflow, focus on the password field after a refusal.

**Departures.** The password field's own message for a wrong password reads "That isn't your password." (the library's `invalid_credentials` text names a username, which isn't typed here). `Field` now takes every `input` prop (a ref), `Section` moved to `SettingsSection.tsx`.

**Owner step.** Deploy server and web together: from the vps-deploy checkout, `node cli.ts public-resource-map all`. Migration 5 runs on the first boot and cannot be stepped back from without the earlier database.
