import { describe, it } from "vitest";

/**
 * SEAM — unit tests for the daily reminder sweep (locked in decisions.md →
 * Favorites & notifications; owned by brief 05). The feature does NOT exist yet.
 *
 * The sweep is deliberately built as a pure-ish function `runReminderSweep(now)`
 * taking the current time so it is unit-testable with NO test-only HTTP route
 * (the prod scheduler calls it on a timer). How brief 05 plugs in — replace the
 * `it.todo`s below:
 *
 *   import { runReminderSweep } from "../jobs/reminder-sweep.js";
 *   import { buildTestApp } from "../test/harness.js";
 *
 *   const { db, close } = await buildTestApp();
 *   // seed a user + favorite_event whose start is the next Bucharest calendar day
 *   const now = new Date("2026-08-01T06:00:00.000Z"); // 09:00 Europe/Bucharest
 *   await runReminderSweep(now, db);
 *   // assert exactly one notification(kind='reminder') row
 *   await runReminderSweep(now, db); // re-run
 *   // assert STILL one row — idempotent via the (userId,eventId,kind) unique index
 */
describe("runReminderSweep(now) [brief 05 — not yet implemented]", () => {
  it.todo("inserts a reminder for a favorite_event starting the next Bucharest calendar day");
  it.todo("is idempotent — re-running the same sweep creates no duplicate reminder row");
  it.todo("uses Europe/Bucharest (not UTC) for the next-calendar-day comparison");
});
