# Brief 29 — Reconcile the deployed schema with `schema.ts` (0001 drift)

> Written 2026-10-03, found while doing brief 23. **Build before brief 05** (favorites & notifications), the first code to write these tables.

## Context

`0001_ward_cutover.sql` was hand-written, and the tables it rebuilt do not match `backend/src/db/schema.ts`. Found by migrating an empty DB through 0000 + 0001, building a second DB from a `drizzle-kit generate` of `schema.ts` alone, and diffing `pragma table_info` / `index_list` / `foreign_key_list`:

| Table | Migrated DB (what production has) | `schema.ts` |
|---|---|---|
| `notification_event` | **no `id` column**; composite PK `(notification_id, event_id)`; `ON DELETE CASCADE` to `notification` | `id` text PK; unique index `notification_event_unique` on the pair; indexes `…_notification_idx`, `…_event_idx`; no cascade |
| `favorite_place` | no `favorite_place_place_idx` | has it |
| `favorite_event` | no `favorite_event_event_idx` | has it |
| all three rebuilt + `notification` | `created_at` default `CURRENT_TIMESTAMP` | `datetime('now')` (same text format; cosmetic) |

Nothing reads or writes these tables yet, so nothing is broken today. The first `db.insert(notificationEvent)` (brief 05) sends an `id` column, and fails on every database already through 0001 with `table notification_event has no column named id`. The missing indexes make "who favourited this place" a table scan.

Brief 23's snapshot describes `schema.ts` (the brief's rule), so `drizzle-kit generate` reports no changes and will **not** emit this fix by itself.

## Decide first
Which shape is right for `notification_event`? The hand-written one (composite PK, cascade) is arguably better: a join row has no identity of its own, and cascading from its notification is what you want. If that wins, change `schema.ts` to match (`primaryKey({ columns: [...] })`, `onDelete: "cascade"`) and regenerate, and drizzle-kit will produce the 0002. If `schema.ts` wins, hand-write 0002.

## What to do
1. Decide the `notification_event` shape (above); record it in `wiki/decisions.md`.
2. Write `0002` so a database through 0001 ends identical to a fresh build of `schema.ts`: rebuild `notification_event` (it is empty in every deployment, but copy rows anyway), and add the two favourite indexes. Ship `meta/0002_snapshot.json`, chained; brief 23's guard test checks the chain.
3. Test: in `migrations.test.ts`, migrate an empty in-memory DB and compare `pragma table_info`, `index_list` and `foreign_key_list` for every table against a DB built from a fresh `drizzle-kit generate` of `schema.ts`, or against a committed expectation. This is the check that found the drift; keep it.

## Acceptance
- The drift check passes; it fails on today's migrations.
- `drizzle-kit generate` on a scratch copy prints "No schema changes".
- `npm run db:migrate` on an empty scratch DB and on a copy of a DB at 0001 both succeed.
