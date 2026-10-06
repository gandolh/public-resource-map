# Brief 32 — Send notification email through Ward

> Written 2026-10-06. **Depends on wzd_auth brief 17** (`POST /notify` and `@ward/client`'s `sendNotification`). The owner chose "Ward sends it" over Ward sharing addresses.

## Context

Brief 05 built favorites and the in-app inbox, and left email unbuilt: prm keys
people on Ward's opaque subject and holds no addresses. Each `notification` row
already has `emailed_at` (null until sent) to guard against sending twice. Ward
brief 17 adds an endpoint that mails a user who holds a prm grant, on prm's behalf,
without the address ever reaching prm.

## Files you OWN
- `backend/src/lib/notify.ts`, `backend/src/lib/reminder-sweep.ts` (or a new `lib/notify-mail.ts` beside them) and tests; `backend/src/lib/mailer.ts` is the dead pre-Ward mailer and can go
- The Ward client wrapper in `backend/src/ward/` (one new call)
- `corpus/wiki/decisions*.md` (the email line in Favorites & notifications), `corpus/wiki/status.md`, `corpus/log.md`

## What to do
1. A sweep that takes notification rows with `emailed_at IS NULL`, builds one plain
   text mail per row (new events at a favorited place; tomorrow's favorited event),
   and calls Ward's `sendNotification`. Coalesce the same way the inbox already does,
   so one accept batch is one mail.
2. `{ sent: true }` or `{ sent: false }`: set `emailed_at` either way (a refusal is
   final; the inbox still has the item). `WardUnavailableError`: leave it null and
   retry on the next sweep.
3. Run the sweep right after the new-events trigger and with the 09:00 Bucharest
   reminder sweep. Never inline in a request.
4. Text in Romanian, matching the inbox wording, with a link to the place or event.

## Acceptance
- Tests with a stub Ward client: each row is sent once even when the sweep runs
  twice; a refusal marks the row; an outage leaves it for the next run.
- `npm test` and `npm run typecheck` pass.
