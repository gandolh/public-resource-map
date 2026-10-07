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

## Outcome (2026-10-07)

Built after Ward's brief 17 landed (wzd_auth `0f8bd20`, `af60f42`), against the final contract in
`wzd_auth/corpus/wiki/integrating.md`.

- **Client:** `sendNotification` in `backend/src/ward/ward.client.ts`, mirrored from Ward's
  `client/src/notify.ts`: `POST /ward-api/notify` with exactly `{ subject, mailSubject, text }`
  and the app key; `{ sent }` on 200; `WardConfigurationError` on 401; `WardUnavailableError` on
  a network error, a 15 s timeout, any other status (Ward's 503 included) or a malformed body.
  The fake Ward records mails and can refuse a subject.
- **Sweep:** a new `backend/src/lib/notify-mail.ts`, not `lib/reminder-sweep.ts`: the reminder
  job lives at `backend/src/jobs/reminder-sweep.ts`, and that is the file changed. The dead
  `lib/mailer.ts` is deleted.
- **One mail per row, which is one mail per batch.** The brief says both. `notifyNewEvents`
  already writes one new-event row per follower per place per accept batch, the same item the
  bell shows, so one mail per row gives one mail per batch per place. Nothing more to coalesce.
- **Answers:** sent or refused marks `emailed_at` (a refusal is final). `WardUnavailableError`
  leaves the row null and stops the sweep. A refused key (`WardConfigurationError`) is treated
  the same and logged at error level, so fixing `WARD_APP_KEY` resumes sending on the next sweep.
- **Added beyond the spec:** a row whose news is already past is marked without a mail: a
  reminder whose event has started or is no longer live, a new-event row whose events are all
  over, or a place that was retired (brief 34). Without this, the first sweep after deploy
  would mail every old inbox item. A retried reminder sent on the day itself says "Azi"
  instead of "Mâine".
- **Text:** Romanian, in the bell's words: "3 evenimente noi la {loc}" (with the bell's three
  plural forms) listing up to 20 events with day and time, or "Mâine: {titlu}, la {loc}" with
  the start. Each ends with "Vezi locul:" and a link to the place, since events have no page of
  their own. The base is `APP_URL`, else `WARD_PUBLIC_ORIGIN` + `PRM_BASE` (`/prm/`), which is
  right where both share one origin, as in the deploy.
- **When:** the sweep is kicked after an accept that wrote inbox rows (after the response, via
  `setImmediate`) and after each run of the reminder sweep (at startup, then 09:00 Bucharest).
  One runner per process keeps two sweeps from overlapping; closing the app waits for one in
  flight. At most 500 rows per run.
- **Follow-up, not changed here:** Ward wraps every mail in an English footer, and prm's text is
  Romanian. Logged in open-questions.md as a Ward-side question.

Verified: client tests for each answer (200 sent and refused, 401, 503, network error, bad
body, timeout, exact body and key). Sweep tests with a stub Ward: each row sent once over two
runs, a refusal marked, an outage and a refused key both leaving rows for the next run, past
news skipped, the exact Romanian text and plural forms, and an accept through the API mailing
the follower via the fake Ward. `npm test` 256 passed, `npm run typecheck` clean, e2e 27/27
run serially (the e2e fake Ward now answers `/notify`).
