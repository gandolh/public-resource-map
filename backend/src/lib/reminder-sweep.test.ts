import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildTestApp, type TestApp } from "../test/harness.js";
import { event, favoriteEvent, notification, place } from "../db/schema.js";
import { runReminderSweep } from "../jobs/reminder-sweep.js";

/** Brief 05: the day-before reminder, in Bucharest time, exactly once. */

let t: TestApp;
let placeId: string;

beforeEach(async () => {
  t = await buildTestApp();
  placeId = t.db
    .insert(place)
    .values({ name: "Muzeul de Artă", category: "museum", city: "Timișoara", lat: 45.75, lng: 21.22 })
    .returning({ id: place.id })
    .get().id;
});
afterEach(async () => {
  await t.close();
});

function favouriteAt(startDate: string, subject = "s1", status = "live") {
  const id = t.db
    .insert(event)
    .values({ placeId, title: `e@${startDate}`, category: "concert", startDate, status })
    .returning({ id: event.id })
    .get().id;
  t.db.insert(favoriteEvent).values({ subject, eventId: id }).run();
  return id;
}
const reminders = () => t.db.select().from(notification).all();

describe("runReminderSweep(now)", () => {
  // 1 August 2026, 09:00 in Bucharest (EEST, UTC+3).
  const now = new Date("2026-08-01T06:00:00.000Z");

  it("reminds about a favourited event starting the next Bucharest day, once", () => {
    const id = favouriteAt("2026-08-02T16:00:00.000Z");
    expect(runReminderSweep(now, t.db)).toBe(1);
    expect(reminders()).toMatchObject([{ subject: "s1", kind: "reminder", eventId: id, placeId }]);
    expect(runReminderSweep(now, t.db)).toBe(0);
    expect(reminders()).toHaveLength(1);
  });

  it("uses Bucharest's calendar day, not UTC's", () => {
    // 2 Aug 00:30 in Bucharest is still 1 Aug in UTC: tomorrow here.
    favouriteAt("2026-08-01T21:30:00.000Z");
    // 3 Aug 00:30 in Bucharest is 2 Aug in UTC: the day after tomorrow here.
    favouriteAt("2026-08-02T21:30:00.000Z");
    // Today, later: not tomorrow.
    favouriteAt("2026-08-01T15:00:00.000Z");
    expect(runReminderSweep(now, t.db)).toBe(1);
    expect(reminders()[0].eventId).toBeTruthy();
    expect(t.db.select().from(event).all().find((e) => e.id === reminders()[0].eventId)?.startDate).toBe(
      "2026-08-01T21:30:00.000Z",
    );
  });

  it("reminds each person who favourited it, and skips events no longer live", () => {
    const id = favouriteAt("2026-08-02T10:00:00.000Z", "a");
    t.db.insert(favoriteEvent).values({ subject: "b", eventId: id }).run();
    favouriteAt("2026-08-02T12:00:00.000Z", "a", "ended");
    expect(runReminderSweep(now, t.db)).toBe(2);
    expect(reminders().map((r) => r.subject).sort()).toEqual(["a", "b"]);
  });
});
