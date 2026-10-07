import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isNull } from "drizzle-orm";
import { buildTestApp, type TestApp } from "../test/harness.js";
import { event, eventSource, favoriteEvent, favoritePlace, notification, place, stagedEvent } from "../db/schema.js";
import { notifyNewEvents } from "./notify.js";
import { runReminderSweep } from "../jobs/reminder-sweep.js";
import { appUrl, newEventsMail, oneLine, runMailSweep, type SendNotification } from "./notify-mail.js";
import type { NotificationInput } from "../ward/ward.client.js";
import { WardConfigurationError, WardUnavailableError } from "../ward/ward.types.js";

/** Brief 32: notification email through Ward, once per inbox row. */

const BASE = "https://example.ro/prm";
// 1 August 2026, 09:00 in Bucharest (EEST, UTC+3).
const now = new Date("2026-08-01T06:00:00.000Z");
const quiet = { info: () => {}, error: () => {} };

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

function eventAt(startDate: string, title = `e@${startDate}`) {
  return t.db.insert(event).values({ placeId, title, category: "concert", startDate }).returning({ id: event.id }).get().id;
}

/** A Ward stub that records what it was asked, answering `answer` (or throwing it). */
function ward(answer: () => Promise<{ sent: boolean }> = async () => ({ sent: true })) {
  const asked: NotificationInput[] = [];
  const send: SendNotification = (input) => {
    asked.push(input);
    return answer();
  };
  return { send, asked };
}

const unsent = () => t.db.select().from(notification).where(isNull(notification.emailedAt)).all();
const sweep = (send: SendNotification) => runMailSweep(t.db, send, now, quiet, BASE);

/** Two followers of the place, an accept batch of three events there, and one favourited event for tomorrow. */
function inbox() {
  for (const subject of ["ana", "dan"]) t.db.insert(favoritePlace).values({ subject, placeId }).run();
  const batch = [
    eventAt("2026-08-05T16:00:00.000Z", "Concert de jazz"),
    eventAt("2026-08-03T15:00:00.000Z", "Vernisaj"),
    eventAt("2026-08-04T17:30:00.000Z", "Atelier\npentru copii"),
  ];
  notifyNewEvents(t.db, batch.map((eventId) => ({ eventId, placeId })), now);
  const tomorrow = eventAt("2026-08-02T16:00:00.000Z", "Recital");
  t.db.insert(favoriteEvent).values({ subject: "ana", eventId: tomorrow }).run();
  runReminderSweep(now, t.db);
}

describe("runMailSweep", () => {
  it("mails each row once, even when the sweep runs twice", async () => {
    inbox();
    const w = ward();
    expect(await sweep(w.send)).toMatchObject({ sent: 3, refused: 0, skipped: 0, deferred: false });
    expect(await sweep(w.send)).toMatchObject({ sent: 0 });
    expect(w.asked).toHaveLength(3);
    expect(unsent()).toHaveLength(0);
  });

  it("one accept batch is one mail per follower, in the inbox's words, listing its events by date", async () => {
    inbox();
    const w = ward();
    await sweep(w.send);
    const news = w.asked.filter((m) => m.mailSubject.startsWith("3 "));
    expect(news.map((m) => m.subject).sort()).toEqual(["ana", "dan"]);
    expect(news[0]).toMatchObject({
      mailSubject: "3 evenimente noi la Muzeul de Artă",
      text:
        "3 evenimente noi la Muzeul de Artă:\n\n" +
        "- Vernisaj, luni, 3 august, 18:00\n" +
        "- Atelier pentru copii, marți, 4 august, 20:30\n" +
        "- Concert de jazz, miercuri, 5 august, 19:00\n\n" +
        `Vezi locul: ${BASE}/places/${placeId}\n`,
    });
  });

  it("a reminder says tomorrow, when, and where", async () => {
    inbox();
    const w = ward();
    await sweep(w.send);
    expect(w.asked.find((m) => m.mailSubject.startsWith("Mâine"))).toEqual({
      subject: "ana",
      mailSubject: "Mâine: Recital, la Muzeul de Artă",
      text: `Mâine: Recital, la Muzeul de Artă.\nÎncepe duminică, 2 august, la 19:00.\n\nVezi locul: ${BASE}/places/${placeId}\n`,
    });
  });

  it("a refusal is final: the row is marked and never asked again", async () => {
    inbox();
    const w = ward(async () => ({ sent: false }));
    expect(await sweep(w.send)).toMatchObject({ sent: 0, refused: 3 });
    expect(unsent()).toHaveLength(0);
    await sweep(w.send);
    expect(w.asked).toHaveLength(3);
  });

  it("an outage leaves every unsent row for the next sweep, and stops this one", async () => {
    inbox();
    const down = ward(() => Promise.reject(new WardUnavailableError("down")));
    expect(await sweep(down.send)).toMatchObject({ sent: 0, deferred: true });
    expect(down.asked).toHaveLength(1);
    expect(unsent()).toHaveLength(3);

    const back = ward();
    expect(await sweep(back.send)).toMatchObject({ sent: 3 });
    expect(unsent()).toHaveLength(0);
  });

  it("a refused app key is treated as an outage, so fixing the key resumes sending", async () => {
    inbox();
    const errors: string[] = [];
    const badKey: SendNotification = () => Promise.reject(new WardConfigurationError("401"));
    const log = { info: () => {}, error: (_obj: object, msg: string) => void errors.push(msg) };
    const result = await runMailSweep(t.db, badKey, now, log, BASE);
    expect(result.deferred).toBe(true);
    expect(unsent()).toHaveLength(3);
    expect(errors).toHaveLength(1);
  });

  it("does not mail news that is already past, but marks it", async () => {
    t.db.insert(favoritePlace).values({ subject: "ana", placeId }).run();
    notifyNewEvents(t.db, [{ eventId: eventAt("2026-07-30T16:00:00.000Z"), placeId }], now);
    const started = eventAt("2026-07-31T16:00:00.000Z");
    t.db.insert(notification).values({ subject: "ana", kind: "reminder", eventId: started, placeId }).run();

    const w = ward();
    expect(await sweep(w.send)).toMatchObject({ sent: 0, skipped: 2 });
    expect(w.asked).toHaveLength(0);
    expect(unsent()).toHaveLength(0);
  });
});

describe("the mail's text", () => {
  const events = (n: number) => Array.from({ length: n }, (_, i) => ({ title: `E${i + 1}`, startDate: "2026-08-03T15:00:00.000Z" }));

  it("uses Romanian's three plural forms, as the bell does", () => {
    expect(newEventsMail("Sala", events(1), BASE).mailSubject).toBe("1 eveniment nou la Sala");
    expect(newEventsMail("Sala", events(2), BASE).mailSubject).toBe("2 evenimente noi la Sala");
    expect(newEventsMail("Sala", events(20), BASE).mailSubject).toBe("20 de evenimente noi la Sala");
  });

  it("lists twenty events and counts the rest", () => {
    const text = newEventsMail("Sala", events(23), BASE).text;
    expect(text).toContain("- E20,");
    expect(text).not.toContain("- E21,");
    expect(text).toContain("- și încă 3");
  });

  it("keeps a subject to one line of at most 200 characters", () => {
    expect(oneLine("a\r\nb\tc")).toBe("a b c");
    expect(oneLine("x".repeat(300))).toHaveLength(200);
  });

  it("links into prm under Ward's origin unless APP_URL says otherwise", () => {
    expect(appUrl({ WARD_PUBLIC_ORIGIN: "https://gandolh.ro/" })).toBe("https://gandolh.ro/prm");
    expect(appUrl({ APP_URL: "http://localhost:5173/prm/" })).toBe("http://localhost:5173/prm");
  });
});

describe("the trigger", () => {
  it("an accept that notifies followers mails them after the response, through Ward", async () => {
    t.db.insert(favoritePlace).values({ subject: "ana", placeId }).run();
    t.db.insert(eventSource).values({ id: "src", name: "Feed", adapterKey: "ical:feed", mechanism: "ical", city: "Timișoara" }).run();
    t.db
      .insert(stagedEvent)
      .values({ id: "s1", sourceId: "src", placeId, matchStatus: "auto-matched", status: "new", title: "Concert", startDate: new Date(Date.now() + 86_400_000).toISOString() })
      .run();
    t.ward.signIn("admin-token", "admin", { prm: ["admin"] });

    const res = await t.app.inject({
      method: "POST",
      url: "/api/admin/staged-events/accept",
      headers: { cookie: "ward_session=admin-token" },
      payload: { ids: ["s1"] },
    });
    expect(res.json().notified).toBe(1);
    await t.app.notifyMail.idle();
    expect(t.ward.mails).toHaveLength(1);
    expect(t.ward.mails[0]).toMatchObject({ subject: "ana", mailSubject: "1 eveniment nou la Muzeul de Artă" });
    expect(unsent()).toHaveLength(0);
  });
});
