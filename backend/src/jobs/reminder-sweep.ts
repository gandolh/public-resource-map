import { and, eq, gte, lt } from "drizzle-orm";
import type { DB } from "../db/index.js";
import { event, favoriteEvent, notification } from "../db/schema.js";
import { zonedParts, zonedTimeToInstant } from "../lib/time.js";

/**
 * The day-before reminder (brief 05; decisions.md → Favorites & notifications).
 *
 * Takes `now` so it is testable with no test-only route. It reminds about
 * every favourited live event starting on the **next calendar day in
 * Bucharest**, not the next 24 hours and not the next UTC day. Idempotent via
 * the unique `(subject, event_id, kind)` index: a restart, a double run or a
 * catch-up run after downtime writes nothing twice.
 *
 * Returns how many reminders it wrote.
 */
export function runReminderSweep(now: Date, db: DB): number {
  const today = zonedParts(now);
  // Day arithmetic on the calendar date, then back to instants: DST-safe,
  // because each midnight is resolved in Bucharest on its own day.
  const tomorrow = new Date(Date.UTC(today.year, today.month - 1, today.day + 1));
  const after = new Date(Date.UTC(today.year, today.month - 1, today.day + 2));
  const from = zonedTimeToInstant(tomorrow.getUTCFullYear(), tomorrow.getUTCMonth() + 1, tomorrow.getUTCDate()).toISOString();
  const to = zonedTimeToInstant(after.getUTCFullYear(), after.getUTCMonth() + 1, after.getUTCDate()).toISOString();

  const due = db
    .select({ subject: favoriteEvent.subject, eventId: event.id, placeId: event.placeId })
    .from(favoriteEvent)
    .innerJoin(event, eq(event.id, favoriteEvent.eventId))
    .where(and(eq(event.status, "live"), gte(event.startDate, from), lt(event.startDate, to)))
    .all();
  if (due.length === 0) return 0;

  const result = db
    .insert(notification)
    .values(due.map((d) => ({ ...d, kind: "reminder", createdAt: now.toISOString() })))
    .onConflictDoNothing()
    .run();
  return result.changes;
}

/** Local hour of the daily sweep. */
export const SWEEP_HOUR = 9;

/**
 * Run the sweep now (it is idempotent, so a restart just catches up), then
 * every day at 09:00 Bucharest. In-process inside the API, as decisions.md
 * locks it: no separate worker, no OS cron. `afterRun` follows every run, even
 * one that wrote nothing: it is how mail Ward could not take yesterday is
 * retried (brief 32). Returns a stop function.
 */
export function startReminderSweep(
  db: DB,
  log: (msg: string) => void,
  afterRun: () => void = () => {},
): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const run = () => {
    try {
      const n = runReminderSweep(new Date(), db);
      if (n > 0) log(`reminder sweep: ${n} reminder(s) written`);
    } catch (err) {
      log(`reminder sweep failed: ${err instanceof Error ? err.message : String(err)}`);
    }
    afterRun();
  };
  const schedule = () => {
    const now = new Date();
    const p = zonedParts(now);
    let next = zonedTimeToInstant(p.year, p.month, p.day, SWEEP_HOUR);
    if (next <= now) {
      const d = new Date(Date.UTC(p.year, p.month - 1, p.day + 1));
      next = zonedTimeToInstant(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), SWEEP_HOUR);
    }
    timer = setTimeout(() => {
      run();
      schedule();
    }, next.getTime() - now.getTime());
    timer.unref?.();
  };
  run();
  schedule();
  return () => clearTimeout(timer);
}

