import { describe, expect, it } from "vitest";
import { groupFor } from "./dates";

/** Noon, Bucharest time, on a calendar day; the offset is right for both 2026 seasons. */
const noon = (day: string) => {
  const summer = day >= "2026-03-29" && day < "2026-10-25";
  return `${day}T12:00:00${summer ? "+03:00" : "+02:00"}`;
};

/**
 * Brief 33: "tomorrow" is the next Bucharest calendar day, not now + 24 h. In
 * 2026 the clocks go forward on 03-29 (a 23-hour day) and back on 10-25 (a
 * 25-hour day); adding 24 h near either switch lands on the wrong date.
 */
const cases: [string, string, string][] = [
  // [now, today, tomorrow]
  ["2026-03-28T23:30:00+02:00", "2026-03-28", "2026-03-29"],
  ["2026-03-29T00:30:00+02:00", "2026-03-29", "2026-03-30"],
  ["2026-03-29T23:30:00+03:00", "2026-03-29", "2026-03-30"],
  ["2026-03-30T00:30:00+03:00", "2026-03-30", "2026-03-31"],
  ["2026-10-24T23:30:00+03:00", "2026-10-24", "2026-10-25"],
  ["2026-10-25T00:30:00+03:00", "2026-10-25", "2026-10-26"],
  ["2026-10-25T23:30:00+02:00", "2026-10-25", "2026-10-26"],
  ["2026-10-26T00:30:00+02:00", "2026-10-26", "2026-10-27"],
];

describe("groupFor across the DST switches (brief 33)", () => {
  it.each(cases)("at %s, tomorrow is %s's next day", (nowIso, today, tomorrow) => {
    const now = new Date(nowIso);
    expect(groupFor(noon(today), null, now)).toBe("today");
    expect(groupFor(noon(tomorrow), null, now)).toBe("tomorrow");
  });

  it("names this weekend by date when the switch falls inside it", () => {
    // Wednesday 23:30, four days before the clocks go forward on Sunday 03-29.
    const now = new Date("2026-03-25T23:30:00+02:00");
    expect(groupFor(noon("2026-03-28"), null, now)).toBe("weekend");
    expect(groupFor(noon("2026-03-29"), null, now)).toBe("weekend");
    expect(groupFor(noon("2026-03-30"), null, now)).toBe("later");
  });

  it("on a Sunday, the weekend is that Saturday and Sunday", () => {
    // Sunday 10-25 at 23:30, after the clocks went back.
    const now = new Date("2026-10-25T23:30:00+02:00");
    expect(groupFor(noon("2026-10-26"), null, now)).toBe("tomorrow");
    expect(groupFor(noon("2026-10-31"), null, now)).toBe("later");
  });

  it("a Friday's tomorrow wins over the weekend", () => {
    const now = new Date("2026-10-23T20:00:00+03:00");
    expect(groupFor(noon("2026-10-24"), null, now)).toBe("tomorrow");
    expect(groupFor(noon("2026-10-25"), null, now)).toBe("weekend");
  });
});
