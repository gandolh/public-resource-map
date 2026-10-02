# Brief 23 — Give `0001_ward_cutover` a drizzle snapshot, so `drizzle-kit generate` is safe again

> Written 2026-09-27 from the [improvements audit](../../todos/2026-09-27-improvements-audit.md) (#6). Independent. **Build before any brief that edits `backend/src/db/schema.ts`.**

## Context

`backend/drizzle/0001_ward_cutover.sql` was hand-written. The journal lists it (`backend/drizzle/meta/_journal.json`, idx 1), but `meta/` holds only `0000_snapshot.json`. drizzle-kit computes the next migration by diffing `schema.ts` against the **newest snapshot**, and that snapshot still contains `user`, `session`, `verification_token`, `reset_token`, and `favorite_place`/`favorite_event`/`notification` keyed on `user_id`.

**Reproduced 2026-09-27** on a scratch copy of `backend/drizzle` (repo untouched), with no schema change since 0001: `drizzle-kit generate` did not report "nothing to migrate". It stopped at an interactive column-rename prompt (`promptColumnsConflicts`), treating the cutover's `user_id → subject` change as not yet made.

**Failure scenario.** The next person to change the schema runs `npx drizzle-kit generate`. Answering the prompts produces a 0002 that re-drops `user`/`session`/token tables and rebuilds the favourite and notification tables. On any database already through 0001 (production included), the migrator then fails (`no such table: user`), or quietly mangles the three rebuilt tables. The deploy's `prm-migrate` step (`infrastructure/docker-compose.yml`) is where it would blow up.

## Files you OWN
- `backend/drizzle/meta/0001_snapshot.json` (new)
- `backend/src/db/migrations.test.ts` (new)

## Files you must NOT touch
- `backend/drizzle/0001_ward_cutover.sql`: already applied in deployed databases; keep it byte-identical.
- `backend/drizzle/meta/_journal.json`: keep the `when` of entry 1 unchanged, because the migrator uses it to decide what has been applied.
- `backend/src/db/schema.ts`: it is already the truth; the snapshot must describe it.

## What to do
1. Produce a snapshot describing the post-0001 schema, chained correctly: new `id`, and `prevId` = the `id` inside `0000_snapshot.json`. Two workable routes; pick one and say which in the log:
   - **Generate and keep only the snapshot.** In a scratch copy of `backend/drizzle` with 0001 and its journal entry removed, run `drizzle-kit generate` (in a real TTY, or under `script -qc`, answering "create column" rather than "rename" so the result matches the hand-written SQL). Take the emitted snapshot, rename it `0001_snapshot.json`, and copy only that file into the repo.
   - **Hand-derive** it from `0000_snapshot.json` by applying 0001's changes: drop four tables, rebuild three with `subject`, and update their indexes and foreign keys.
2. **Guard test** in `migrations.test.ts`: every `_journal.json` entry has a matching `meta/<idx>_snapshot.json`, and each snapshot's `prevId` equals the previous snapshot's `id`. Cheap, and it stops the next hand-written migration repeating this.

## Acceptance
- On a scratch copy of the repo's `backend/drizzle` (scratch `out`, repo schema), `drizzle-kit generate` prints **"No schema changes, nothing to migrate"** without prompting. Paste the output into the log entry.
- `npm run db:migrate -w backend` against an empty scratch `DATABASE_PATH` still succeeds (the SQL files are unchanged).
- The guard test passes, and fails if you temporarily delete `0001_snapshot.json`.
- `npm test`, `npm run typecheck` green.

## Outcome (2026-10-03)

Done. Route: neither of the two listed, but equivalent to the first. `drizzle-kit generate` against `schema.ts` into an **empty** scratch `out` gives a full-schema snapshot with no prompts at all. A snapshot is a whole-schema description, not a diff, so that file *is* the post-0001 snapshot once re-chained: new `id` `f7db1419-…`, `prevId` = 0000's `a0ad6566-…`. Only `meta/0001_snapshot.json` entered the repo. The SQL and the journal are untouched.

Acceptance, run on a scratch copy of `backend/drizzle`: `drizzle-kit generate` printed `No schema changes, nothing to migrate 😴` with no prompt. `npm run db:migrate -w backend` on an empty scratch `DATABASE_PATH` printed `Migrations applied successfully`. `migrations.test.ts` passes, and both of its tests fail with `0001_snapshot.json` removed. Tests 77 pass + 3 todo, and typecheck is clean.

**Found on the way:** the hand-written 0001 does not build what `schema.ts` describes. `notification_event` has no `id` and a composite PK, and two favourite indexes are missing. It is latent until brief 05 writes those tables, and filed as [brief 29](../todo/29-reconcile-0001-with-schema.md).
