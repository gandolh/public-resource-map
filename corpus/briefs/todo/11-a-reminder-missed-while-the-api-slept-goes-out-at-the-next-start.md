# Brief 11: A reminder missed while the API slept goes out at the next start

**Depends on:** nothing. **Runs after:** 10.
**Builder:** Sonnet.
**Before you start:** run `brief-board guide` (the repo's `CLAUDE.md` says so).

Filed 2026-11-24 from the estate's infra review. The owner's answer that day: this app may sleep. vps-deploy stops
a sleeping app after 15 minutes with no request and starts it on the next one (Sablier; a request waits a few
seconds for the start). Asleep, the API frees about 45 MiB of the box's 3.7 GiB. vps-deploy will also wake it with
one request at 09:00 Bucharest every day, so the sweep runs at its usual hour. That part is vps-deploy's; this
brief makes the app safe to stop.

## Context

What the code does today (`backend/src/features/reminders/reminder-sweep.ts`):

- `startReminderSweep` runs the sweep once at start (line 98), then every day at 09:00 Bucharest (lines 84-97).
  The sweep is idempotent through the unique `(subject, event_id, kind)` index. So "run on start" already holds,
  and no state file is needed for it.
- Each run covers only the next calendar day in Bucharest (`runReminderSweep`, lines 21-31: from tomorrow's
  midnight to the day after's). A day the API spends asleep through 09:00, with no wake, loses that day's run: the
  events starting the next day never get their reminder, because the next run already looks a day further.
  The same gap exists today for an event favourited after the 09:00 run for the next day.
- `afterRun` kicks the Ward mail sweep (`notify-mail.ts`) after every run; mail Ward couldn't take is retried on
  the next run. Asleep, "the next run" is the next start.
- Nothing else in `backend/src` runs on a timer (ingestion is admin-triggered, decisions.md).

[decisions.md](../../wiki/decisions.md) locks the sweep in-process, "not OS cron" (Favorites & notifications, and
the deploy section). That holds: the box's timer only sends a request; the sweep still runs inside the API.

## Decisions

- The window of every run is from **now** to the end of the next Bucharest day. An event that missed its
  day-before reminder gets one on its own day if it hasn't started; one that has started gets none. The unique
  index keeps it to one reminder per person and event. A late reminder beats none.
- Nothing else changes: the 09:00 schedule, the start-up run, the mail kick.
- decisions.md gets a dated revisit note under Favorites & notifications: the API may sleep (owner, 2026-11-24);
  vps-deploy wakes it at 09:00 Bucharest; the sweep stays in-process; the window now starts at the run's time.

## Files you OWN

- `backend/src/features/reminders/reminder-sweep.ts` and `reminder-sweep.test.ts`
- `corpus/wiki/decisions.md` (the revisit note), and the closeout: the outcome note, `corpus/log.md`,
  `corpus/wiki/status.md`

## Files you must NOT touch

- `notify-mail.ts` and the mail retry rules.
- The database schema and migrations.
- vps-deploy: read only. The `sleep` setting and the wake timer are its changes.

## What to do

1. **Confirm the premise.** Read `startReminderSweep` and `runReminderSweep` and check the two facts in Context
   (run at start; window is tomorrow only). Grep `backend/src` for `setInterval`, `setTimeout` and `cron`. If
   either fact is wrong, or another timer would be cut by a stop, stop and hand back with what you found.
2. Change the window's start to `now`, keeping the end at the end of the next Bucharest day.
3. Tests, with fixed `now` values: a run at 10:00 on day D reminds about a favourited event at 18:00 on D and one
   at 12:00 on D+1; it writes nothing for an event that started at 08:00 on D; a second run at 10:05 writes
   nothing; the existing Bucharest-midnight and DST cases still pass.
4. The decisions.md note.

## Acceptance

- [ ] Step 1's findings are in the outcome.
- [ ] The tests above pass; `npm run check` exits 0; `bash corpus/lint.sh` passes.
- [ ] End move `ready_for_deploy`.

## Owner steps

- `node cli.ts public-resource-map server` from vps-deploy. The sleep itself ships later with vps-deploy's change,
  after this deploy.
