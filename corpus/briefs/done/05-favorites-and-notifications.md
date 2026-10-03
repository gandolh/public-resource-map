# Brief 05 — Favorites & in-app notifications

> Split from the original brief 02 on 2026-06-28. Depends on **brief 02** (users), **brief 03** (places), **brief 04** (events + the accept step that fires trigger #1). Implements [decisions.md → Favorites & notifications](../../wiki/decisions.md).

## Goal

The POC's demoed retention loop: users favorite **places** and **events**, and receive notifications — **in-app inbox AND email** — when new events appear at a favorited place, and one day before a favorited event.

## Scope

- **In-app inbox + email** (revised 2026-06-28 — was in-app-only). The inbox/bell is the read-model; **email is a second delivery channel on the same `notification` rows**, reusing the auth verify/reset email infra (console-logged in dev, provider before launch). Rationale: the away-from-app ping is the core of the retention loop (Bandsintown/Apple Music). **Web/native push stays OUT** — post-POC upgrade.
- **Email is best-effort + idempotent** off the notification rows (a `emailedAt` marker; never double-send on retry).
- **Two favorite entities:** `favorite_place` (drives "new here") and `favorite_event` (drives day-before reminders).
- **Two triggers:**
  1. **New-events** — synchronous, at the **admin-accept step** (brief 04): notify users who `favorite_place`d the affected place. **Coalesced per (place, accept-batch)** (locked 2026-06-28, stress-test): a bulk-accept of N events at one place produces **one** inbox item ("8 new events at Muzeul de Artă" → expands to the list), NOT N items — otherwise a popular place floods the bell. (Not at scrape time.)
  2. **Day-before reminder** — an **in-process daily sweep inside the Fastify API** (not a separate process/OS cron). Fixed local time (e.g. 09:00 **Europe/Bucharest**); selects `favorite_event`s whose start is the **next calendar day in Bucharest time**; inserts reminder inbox rows. **Per-event** (the user opted into that specific event). **Idempotent** via unique `(userId, eventId, kind='reminder')` — safe across restarts/double-runs. Compare in **Europe/Bucharest**, not UTC (events are ISO 8601 strings).

## Data model (Drizzle/SQLite)

- `favorite_place` — userId, placeId (unique pair).
- `favorite_event` — userId, eventId (unique pair).
- `notification` — id, userId, kind (`new-event` | `reminder`), placeId, readAt (nullable), **`emailedAt` (nullable — set once the email is sent; guards against double-send)**, createdAt.
  - **`reminder`**: one row per favorited event → carries `eventId`; idempotent via unique `(userId, eventId, kind)`.
  - **`new-event` (coalesced)**: one row per (place, accept-batch) → carries `placeId` + a `batchId` (or accept-timestamp) + the set of new event ids (a `notification_event` join table, or a JSON id list). Idempotent via unique `(userId, placeId, batchId)`. The dropdown expands it to the event list.

## API

| Method | Path | Description |
|---|---|---|
| POST/DELETE | `/api/favorites/places/:placeId` | add/remove place favorite |
| POST/DELETE | `/api/favorites/events/:eventId` | add/remove event favorite |
| GET | `/api/notifications` | inbox list (unread count + items) |
| POST | `/api/notifications/read` | mark read (ids or all) |

All require a logged-in user.

## UI

- **Favorite (star) controls** on the place panel and on event rows.
- **Notification bell** in the Navbar with an unread badge; a dropdown/inbox listing items, each linking to its place/event. Mark-read on open.
- A "my favorites" view (places + events) is nice-to-have, not required for the POC.

## Testing

E2e (the chosen model handles this well — it's all DB + UI, no external delivery):
- favorite a place → admin accepts an event there → bell shows 1 unread → item links to the place.
- favorite an event starting tomorrow → run the sweep → reminder appears once; run sweep again → still once (idempotent).

## Acceptance criteria

- Users can favorite/unfavorite places and events; state persists per user.
- Accepting events creates `new-event` inbox items for place-favoriters (and only them).
- The daily sweep creates exactly one `reminder` per favorited event per day-before, in Bucharest time, idempotently.
- The bell shows accurate unread counts; items link correctly; marking read works.

## Outcome (2026-10-03)

**In-app favourites and notifications are done and were walked end to end
against the local Ward. Email is not built:** since the Ward cutover prm does
not know anyone's address.

**Backend:**
- `routes/favorites.ts`, all behind `requireAuth` and keyed on Ward's subject:
  - `GET /api/favorites`, and `POST`/`DELETE` on `/api/favorites/{places,events}/:id`.
    Both are idempotent; an unknown id is a 404.
  - `GET /api/notifications` returns the 50 newest, each with its place and its
    events, plus the unread count.
  - `POST /api/notifications/read` takes `{ids}` or `{all: true}`, and only ever
    touches the caller's own rows.
- **The new-events trigger** (`lib/notify.ts`) runs at the end of brief 04's
  accept. It considers only events newly created and live (a re-accepted change
  or a cancellation is not news). One accept is one batch, and each follower of
  a place gets **one** item for it, linked to its events through
  `notification_event`: "3 new events at Muzeul de Artă", not three.
- **The day-before sweep** (`jobs/reminder-sweep.ts`): `runReminderSweep(now, db)`
  reminds about every favourited live event starting on the **next Bucharest
  calendar day**. The day arithmetic is done on the calendar date, so it is
  DST-safe. It is idempotent through the unique `(subject, event_id, kind)`
  index. `index.ts` (not `buildApp`, so tests start no timers) runs it at
  startup, so a restart catches up, and then daily at 09:00 Bucharest; the
  timer is unref'd.

**UI:**
- A **star** in the place header ("Follow …") and a **bell** on each event row
  ("Remind me of …"), optimistic and rolled back on error.
- **Signed out**, either opens a small prompt with sign-in and register links
  whose `next` is this page plus `?favorite=place:<id>`. Back from Ward,
  `usePendingFavorite` (in the Navbar) completes the favourite and strips the
  parameter: decisions.md's "contextual sign-in, then complete the favourite".
- A **bell** in the header, signed in only: an unread badge, polled once a
  minute, and a popover listing items, each linking to its place. Opening it
  marks everything read.

**Checked in the browser** with the local Ward, on the reseeded scratch DB:
- Signed out, the star prompt led to Ward, and the return completed the
  favourite (the URL came back clean).
- An admin resolving and accepting "Atelier de gravură" at that museum
  answered `notified: 1`. The bell showed "1 eveniment nou la Muzeul de Artă
  Timișoara".
- Asking to be reminded of tomorrow's event and restarting the API logged
  "reminder sweep: 1 reminder(s) written". The bell showed "Mâine: Tur ghidat …,
  4 oct. · 11:00".

**Tests:**
- 6 API tests: auth, per-person idempotent favourites, 404s, the coalesced
  trigger reaching followers only, a second batch as a second item, read by id
  or all, and nobody reading someone else's items.
- The 3 sweep `todo`s are real tests now: once, Bucharest's day rather than
  UTC's, every follower, not-live events skipped.
- 1 e2e spec for the signed-out star's return path.
- `npm test` is 164 with no todos left; e2e 15; typecheck clean.

**Not built: the email channel.** prm keys people on Ward's opaque subject and
holds no addresses, and the verify/reset mailer this brief meant to reuse was
for the auth Ward replaced. Sending needs one of two things: Ward exposes a
verified address to the app's key, or Ward sends notification mail on prm's
behalf. That is a Ward-side decision (recorded in decisions.md).
`notification.emailed_at` is ready for whichever comes.
