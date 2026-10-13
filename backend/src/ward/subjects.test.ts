import { afterEach, describe, expect, it } from "vitest";
import { buildTestApp, type TestApp } from "../test/harness.js";
import { favoriteEvent, favoritePlace, notification, place, event } from "../db/schema.js";
import { adoptWardSubjects } from "./subjects.js";

/**
 * Brief 24 (Ward's corpus): rows keyed by a Ward subject from before prm had
 * users keep their keys. Each subject becomes a local user whose id is that
 * subject, linked to it.
 */

const ANA = "0123456789abcdef0123456789abcdef";
const DAN = "fedcba9876543210fedcba9876543210";
/** Shares ANA's first eight characters, so its short placeholder is taken. */
const TWIN = "01234567ffffffffffffffffffffffff";

let t: TestApp;
afterEach(async () => {
  await t.close();
});

/** What prm's database held before brief 24: rows keyed by Ward subjects. */
function legacyRows(db: TestApp["db"]) {
  db.insert(place).values({ id: "museum", name: "Muzeul", category: "museum", city: "Timișoara", lat: 45.75, lng: 21.22 }).run();
  db.insert(event).values({ id: "show", placeId: "museum", title: "Show", category: "concert", startDate: "2030-01-01T18:00:00.000Z" }).run();
  db.insert(favoritePlace).values([
    { subject: ANA, placeId: "museum" },
    { subject: TWIN, placeId: "museum" },
  ]).run();
  db.insert(favoriteEvent).values({ subject: DAN, eventId: "show" }).run();
  db.insert(notification).values({ subject: DAN, kind: "reminder", eventId: "show", placeId: "museum" }).run();
}

describe("adopting Ward subjects on boot", () => {
  it("makes each subject a linked user whose id is the subject, with no password", async () => {
    t = await buildTestApp({ before: legacyRows });
    const { accounts, identities } = t.app.auth;

    for (const subject of [ANA, DAN, TWIN]) {
      const user = await identities.findUserBySubject(subject);
      expect(user, subject).toMatchObject({ id: subject, role: "user", hasPassword: false });
    }
    expect((await accounts.findUserById(ANA))?.username).toBe("user-01234567");
    expect((await accounts.findUserById(DAN))?.username).toBe("user-fedcba98");
    // The twin's short name was taken: it gets the whole subject.
    expect((await accounts.findUserById(TWIN))?.username).toBe(`user-${TWIN}`);
  });

  it("a migrated person sees their rows once signed in", async () => {
    t = await buildTestApp({ before: legacyRows });
    // Their next "Sign in with Ward" finds the linked user, not a new one.
    const { user, created } = await t.app.auth.identities.userForSignIn({
      subject: DAN,
      username: "dan",
      role: "admin",
      wardSid: "sid",
      idToken: "x",
    });
    expect(created).toBe(false);
    expect(user.id).toBe(DAN);

    const { cookie } = await t.signIn("user", DAN);
    const res = await t.app.inject({ method: "GET", url: "/api/favorites", headers: { cookie } });
    expect(res.json()).toEqual({ places: [], events: ["show"] });
    const inbox = await t.app.inject({ method: "GET", url: "/api/notifications", headers: { cookie } });
    expect(inbox.json().unread).toBe(1);
  });

  it("is safe to run again, and leaves rows keyed by a local user alone", async () => {
    t = await buildTestApp({ before: legacyRows });
    const local = await t.signIn("user");
    t.db.insert(favoritePlace).values({ subject: local.id, placeId: "museum" }).run();

    expect(await adoptWardSubjects(t.sqlite, t.app.auth.identities)).toEqual({ created: [], skipped: [] });
    expect(await t.app.auth.identities.findUserBySubject(local.id)).toBeUndefined();
  });

  it("an empty database creates nobody", async () => {
    t = await buildTestApp();
    expect(await adoptWardSubjects(t.sqlite, t.app.auth.identities)).toEqual({ created: [], skipped: [] });
  });
});
