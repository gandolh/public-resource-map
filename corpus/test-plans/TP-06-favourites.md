# TP-06 — Favourites and notifications

Needs the local Ward for the signed-in half (see TP-05). Seed a demo user with
your Ward subject, read from `GET /prm-api/api/me` once signed in:

```bash
SEED_DEMO_SUBJECT=<your subject> npm run db:seed -w backend
```

## Goal

People follow places and ask to be reminded of events. Accepting new events
at a followed place gives one bell item per batch. The day before a saved
event, a reminder arrives once. All of it is in-app; email waits on Ward
(decisions.md).

## Cases

1. **Signed out, the star explains itself.** Its sign-in link goes through
   Ward and returns with `?favorite=place:<id>`, which completes the follow.
   The bell is hidden.
   e2e `favorites.spec › a signed-out star offers sign-in …`; **manual** for
   the completed follow after Ward.
2. **Follow and unfollow** a place, and save and unsave an event. Both are
   idempotent and per person.
   api `favorites.api.test › favourites` (3 tests); e2e `signed-in.spec ›
   following a place from its page sticks, …`.
3. **The demo seed shows the loop.** The demo subject follows Muzeul de Artă
   and MNAR, has one saved event at the Timișoara theatre, and the bell shows 1
   unread "new events at Muzeul de Artă", read once opened. e2e
   `signed-in.spec › the demo user's bell …`, `› the place a demo user follows
   shows as followed` (the e2e seed's demo subject is `e2e-demo`).
4. **Accept → bell.**
   - Steps: as admin (TP-07), accept an event at a place you follow. The bell
     gains one item for the batch, however many events it published there.
   - A second accept is a second item.
   - Opening the bell marks items read.
   - api `favorites.api.test › the new-events trigger at accept` (3 tests);
     **manual** end to end.
5. **Reminder sweep.**
   - Save an event that starts tomorrow (Bucharest), then run the sweep: there
     is exactly one reminder.
   - Run it again: still one.
   - The day boundary is Bucharest's, not UTC's.
   - api `reminder-sweep.test` (3 tests).
6. **Nobody reads another person's items.**
   api `favorites.api.test › nobody can read or mark someone else's items`.
7. **My past events.** Signed in, `/archive` opens on "My past events": saved
   events and those at followed places, once they are over.
   api `archive.api.test`; e2e `archive.spec` (signed out) and
   `signed-in.spec › signed in, the archive opens on My past events`.

## Pass criteria

- The api and e2e tests named are green.
- Manual cases 1 to 4 behave as described against the local Ward.
