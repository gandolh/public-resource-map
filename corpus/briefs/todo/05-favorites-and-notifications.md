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
