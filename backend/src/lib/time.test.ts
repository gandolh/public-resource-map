import { describe, expect, it } from "vitest";
import { lensWindow, zonedParts, zonedTimeToInstant } from "./time.js";

// "Today" and "this weekend" are Bucharest concepts, not UTC ones. These tests
// pin the conversion at both DST offsets, because getting it wrong shifts every
// event grouping in the UI by up to three hours.
describe("Europe/Bucharest time", () => {
  it("reads the local wall clock in summer (EEST, UTC+3)", () => {
    const p = zonedParts(new Date("2026-09-04T09:00:00.000Z"));
    expect(p).toMatchObject({ year: 2026, month: 9, day: 4, hour: 12, weekday: 5 });
  });

  it("reads the local wall clock in winter (EET, UTC+2)", () => {
    const p = zonedParts(new Date("2026-01-14T09:00:00.000Z"));
    expect(p).toMatchObject({ year: 2026, month: 1, day: 14, hour: 11 });
  });

  it("maps a local wall-clock time back to the right instant across DST", () => {
    expect(zonedTimeToInstant(2026, 9, 4, 23, 59, 59).toISOString())
      .toBe("2026-09-04T20:59:59.000Z");
    expect(zonedTimeToInstant(2026, 1, 14, 23, 59, 59).toISOString())
      .toBe("2026-01-14T21:59:59.000Z");
  });

  it("'today' runs from now to the end of the local day, not the UTC day", () => {
    const now = new Date("2026-09-04T09:00:00.000Z");
    const w = lensWindow("today", now);
    expect(w.from).toBe("2026-09-04T09:00:00.000Z");
    expect(w.to).toBe("2026-09-04T20:59:59.000Z");
  });

  it("'weekend' on a weekday reaches forward to Sat 00:00 → Sun 23:59 local", () => {
    // 2026-09-04 is a Friday.
    const w = lensWindow("weekend", new Date("2026-09-04T09:00:00.000Z"));
    expect(w.from).toBe("2026-09-04T21:00:00.000Z"); // Sat 00:00 in Bucharest
    expect(w.to).toBe("2026-09-06T20:59:59.000Z"); // Sun 23:59:59 in Bucharest
  });

  it("'weekend' during the weekend starts now, never in the past", () => {
    // Sunday 2026-09-06, local noon — the weekend is in progress.
    const now = new Date("2026-09-06T09:00:00.000Z");
    const w = lensWindow("weekend", now);
    expect(w.from).toBe(now.toISOString());
    expect(w.to).toBe("2026-09-06T20:59:59.000Z");
  });

  it("'all' caps the horizon at 90 days so a panel cannot fill with 2028", () => {
    const now = new Date("2026-09-04T09:00:00.000Z");
    const w = lensWindow("all", now);
    expect(w.from).toBe(now.toISOString());
    expect(new Date(w.to).getTime() - now.getTime()).toBe(90 * 86_400_000);
  });
});
