# Test Results — Run 2026-10-04

- **Automated:**
  - `npm test` 176 passed;
  - `npm run test:e2e` 20 passed;
  - `npm run typecheck` clean.
- **Manual:**
  - `npm run dev` on a scratch database seeded by brief 08 (2,677 places, 15
    synthetic events), against the local Ward container (`localhost:8792`).
  - Signed in as the local owner account, which holds `prm:admin`.
  - Seeded with `SEED_DEMO_SUBJECT` set to that account's subject.
- **Not available:** a second Ward account without `prm:admin`, so the
  non-admin page was not walked (the API's 403 is under test).

## Summary

| Plan | Result | Notes |
|---|---|---|
| TP-01 Map | **PASS** after fixes | e2e green. Found that pins had no accessible name, clusters were named by a bare digit, and Enter on a pin did nothing (F-01, F-02, fixed). Cases 7 and 8 (city picker, geolocation denied) not walked by hand this run |
| TP-02 What's on | **PASS** after fix | e2e green; at 375 px a wrapped row left its "·" dangling (F-03, fixed). Cases 3, 5 and 7 not walked by hand |
| TP-03 Place | **PASS** | e2e green; ticket link present and absent seen on Muzeul de Artă. Cases 4 to 6 not walked by hand |
| TP-04 UI audit | **PASS w/ findings** (partial) | Walked: dark theme at 375 (map, what's on; no horizontal scroll), keyboard on the map, accessible names. F-01, F-02 and F-04 came from here. Not walked: light theme at 375, admin at 375, the error states, a contrast measurement |
| TP-05 Sign-in | **FAIL (Ward)** | Log in now returns to the page it left (F-05, fixed). **Sign out at Ward does not end the session**: after Ward's Sign out, `/api/me` still names the person past prm's 30 s introspection cache. This is the known Ward bug (its refresh cookie's path never reaches `/logout`), not prm's |
| TP-06 Favourites | **PASS** | Signed-out star → Ward → back with the follow completed; the demo seed's bell item; accepting at a followed place added one new unread item, and opening the bell marked the old one read |
| TP-07 Admin ingestion | **PASS** after fix | Walked with a local `.ics` of 5 events. The category guesser read "matched" as Sport (F-06, fixed) |

## Walk details

**TP-07**, refreshing a five-event feed:
- First refresh: "3 read, 3 new, 2 unreadable". The unreadable rows were the
  `RRULE` event (by design: recurring events are not expanded) and the
  untitled one.
- Queue buckets: unreadable 2, unsure place 2, ready 1, with ready
  pre-selected.
- Accept selection put "Walk: matched at the art museum" on what's on at
  Muzeul de Artă.
- The county-library row offered three named candidates (100 / 90 / 88 %).
  Choosing the first enabled Accept, and it went live there.
- "Club Nicăieri", an invented venue, came out *unsure* rather than *no place*:
  among 2,677 real places, "Club Norișor" is close enough to offer. That is the
  matcher working as designed. A click on the drawer map, Use this pin and
  Accept created an `event-venue` place with `isManualPin: true` inside the
  city.
- Bulk reject: "Rejected: 2".
- A second refresh: 0 new, and the queue stayed empty (rejected rows stay
  rejected even when re-quarantined).
- An empty feed showed **Suspect** on Sources.

**TP-05:**
- Logged in from `/prm/whats-on?city=x` and came back to exactly that URL.
- Signed out, `/api/me` answers `{"user": null}` with 200. The plan first said
  401, which was the plan's error, not the app's.

## Findings

| # | Finding | Status |
|---|---|---|
| F-01 | Place pins were `role="button"` with **no accessible name** (Leaflet ignores `alt` on a div icon), and clusters were named by their digit, not their `title` | **Fixed**: inner markup `aria-hidden`, pins titled "Place · N events"; e2e |
| F-02 | **Enter or Space on a focused pin did nothing.** Leaflet answers Enter only on markers with a popup | **Fixed**: keydown activates pins (open) and clusters (zoom); e2e |
| F-03 | What's on / archive rows at 375 px wrapped and left "·" dangling at the line end | **Fixed**: one line, the place name truncates |
| F-04 | The review drawer's candidate buttons were all named "Use this place" | **Fixed**: named "Use <place>" |
| F-05 | The navbar's Log in and Create account always returned to the map, not the page they were opened on | **Fixed**: `next` is the current page; e2e |
| F-06 | The iCal category guesser matched stems inside words ("matched" → Sport; also "transport", "concurs", "cooperare") | **Fixed**: stems match from a word start; tests |
| F-07 | Ward's Sign out does not end the session | **Open, Ward-side** (already known; see the local Ward notes) |
| F-08 | The city bboxes take in neighbouring towns (Giroc, Dumbrăvița, Bragadiru…) | Open; noted by brief 08, a sync change |

Screenshots stay out of git (they went to the session scratchpad).
