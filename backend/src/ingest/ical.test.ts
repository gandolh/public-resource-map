import { describe, expect, it } from "vitest";
import { guessCategory, parseIcal } from "./ical.js";

const feed = (...events: string[]) =>
  ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//test//EN", ...events, "END:VCALENDAR"].join("\r\n");

const vevent = (...lines: string[]) => ["BEGIN:VEVENT", ...lines, "END:VEVENT"].join("\r\n");

describe("parseIcal (brief 04)", () => {
  it("reads a Bucharest-zoned event, unfolding and unescaping its text", () => {
    const [row] = parseIcal(
      feed(
        vevent(
          "UID:abc-1@cpt.ro",
          "SUMMARY:Concert în aer liber\\, Fanfara",
          "DTSTART;TZID=Europe/Bucharest:20261010T190000",
          "DTEND;TZID=Europe/Bucharest:20261010T210000",
          "LOCATION:Sala Mare\\, Casa de Cultură",
          "DESCRIPTION:Prima linie\\nA doua lin",
          " ie",
          "URL:https://example.ro/e/1",
        ),
      ),
    );
    expect(row.problem).toBeUndefined();
    expect(row.raw).toMatchObject({
      externalId: "abc-1@cpt.ro",
      title: "Concert în aer liber, Fanfara",
      // 19:00 in Bucharest in October is 16:00 UTC (EEST, +3).
      startDate: "2026-10-10T16:00:00.000Z",
      endDate: "2026-10-10T18:00:00.000Z",
      venue: "Sala Mare, Casa de Cultură",
      description: "Prima linie\nA doua linie",
      sourceUrl: "https://example.ro/e/1",
      category: "concert",
    });
  });

  it("takes UTC as given, a floating time as Bucharest, and an all-day date as its local midnight", () => {
    const rows = parseIcal(
      feed(
        vevent("UID:u", "SUMMARY:a", "DTSTART:20261201T100000Z", "LOCATION:x"),
        vevent("UID:f", "SUMMARY:b", "DTSTART:20261201T100000", "LOCATION:x"),
        vevent("UID:d", "SUMMARY:c", "DTSTART;VALUE=DATE:20261201", "LOCATION:x"),
      ),
    );
    expect(rows.map((r) => r.raw.startDate)).toEqual([
      "2026-12-01T10:00:00.000Z",
      "2026-12-01T08:00:00.000Z", // EET, +2
      "2026-11-30T22:00:00.000Z",
    ]);
  });

  it("flags what it will not guess: another time zone, a recurrence", () => {
    const [tz, rec] = parseIcal(
      feed(
        vevent("UID:1", "SUMMARY:a", "DTSTART;TZID=America/New_York:20261201T100000", "LOCATION:x"),
        vevent("UID:2", "SUMMARY:b", "DTSTART:20261201T100000Z", "RRULE:FREQ=WEEKLY", "LOCATION:x"),
      ),
    );
    expect(tz.problem).toMatch(/time zone America\/New_York/);
    expect(rec.problem).toMatch(/RRULE/);
  });

  it("marks a cancelled event and skips nested alarms", () => {
    const [row] = parseIcal(
      feed(
        vevent(
          "UID:c",
          "SUMMARY:Anulat",
          "DTSTART:20261201T100000Z",
          "STATUS:CANCELLED",
          "BEGIN:VALARM",
          "DESCRIPTION:not the event",
          "END:VALARM",
          "LOCATION:x",
        ),
      ),
    );
    expect(row.raw.cancelled).toBe(true);
    expect(row.raw.description).toBeUndefined();
    expect(row.raw.venue).toBe("x");
  });
});

// Found walking TP-07 (brief 10): "Walk: matched at the art museum" came out
// Sport, because `match` matched inside "matched". Words match from their start.
describe("guessCategory", () => {
  it("reads a source's own words, in Romanian or English, with or without diacritics", () => {
    expect(guessCategory("Concert de jazz")).toBe("concert");
    expect(guessCategory("Spectacol de teatru")).toBe("theater");
    expect(guessCategory("Vernisaj: Expoziție de grafică")).toBe("exhibition");
    expect(guessCategory("Meciul de fotbal")).toBe("sport");
    expect(guessCategory("Lansare de carte")).toBe("community");
    expect(guessCategory("Ateliere pentru copii")).toBe("workshop");
  });

  it("does not find a word inside another one", () => {
    expect(guessCategory("Walk: matched at the art museum")).toBeUndefined();
    expect(guessCategory("Transportul public în dezbatere")).toBe("community");
    expect(guessCategory("Concurs de desen")).toBeUndefined();
    expect(guessCategory("Cooperare culturală")).toBeUndefined();
  });
});
