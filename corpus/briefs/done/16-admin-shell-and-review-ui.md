# Brief 16 — Admin shell & ingestion review UI

> Split from [brief 13](13-ui-interactions-and-features.md) on 2026-06-29 — a separate audience, route tree, and gate; not part of the public UI. Depends on **brief 02** (admin gate), **brief 04** (ingestion API + staged-events it renders), **brief 03** (places, for the map preview). The frontend for the admin ingestion pipeline.

## /admin shell (own contextual menu)

- `/admin` uses its **own layout** (distinct from the public Navbar): a **sidebar nav** — *Sources, Review queue, Places, (later) Users* — plus an **"exit to public site"** link and the admin's identity.
- **Route-lazy-loaded** ([brief 12](12-platform-optimization.md)) so public users never download admin code. Behind the **admin gate** (brief 02); non-admins are redirected/403.

## Review screen (the ingestion heart)

- A **dense, sortable/filterable table** grouped by source→status, **per-row checkboxes + sticky bulk-action toolbar** (bulk accept/reject). Row click → **detail drawer** with full fields, a **small map preview** of the geocoded/matched location ([brief 03] place data), and the **ambiguous-match resolver** (pick the right OSM place / set a manual pin). Buckets (new/changed/stale/ambiguous/needs-attention) as table filters/tabs.
- **Review-at-scale = confidence-sorted** (a "refresh all" can stage hundreds): **high-confidence rows** (auto-matched place, clean fields, not duplicate-ish) are **pre-selected for one-click bulk accept**; **low-confidence buckets** (ambiguous match, needs-attention, geocode-failed, `changed`) are **surfaced first** for individual attention. The reviewer spends judgment only where it's needed — scales curation without rubber-stamping.

## Sources panel

- Table of configured `event_source`s with **mechanism** + **health** (lastStatus, lastEventCount, lastSuccessfulAt; the **`suspect`** flag on 0/big-drop loud and visible); per-source **Refresh** + a **Refresh all**; an **OSM sync** action per city (brief 03). Enable/disable a source.

## States & accessibility

- Loading (skeleton) / empty ("no staged events — run a refresh") / error (retry) for the table + panels.
- **WCAG AA:** keyboard nav + ARIA for the table, bulk-select, and detail drawer; focus management on drawer open/close (consistent with brief 13).

## Calls (backend from brief 04 / 03)

`GET /api/admin/sources`, `POST /api/admin/sources/:id/refresh`, `POST /api/admin/sources/refresh-all`, `GET /api/admin/staged-events`, `POST /api/admin/staged-events/accept|reject`, `POST /api/admin/staged-events/:id/place`, `POST /api/admin/osm/sync`. (All admin-gated; defined in briefs 04/03.)

## Acceptance criteria

- `/admin` has its own sidebar shell, is route-lazy-loaded, and rejects/redirects non-admins.
- The review table supports bulk accept/reject, row detail drawer with map preview, and ambiguous-match resolution; buckets are filterable; high-confidence rows are pre-selected, low-confidence surfaced first.
- The sources panel shows per-source mechanism + health (incl. `suspect`), per-source + all refresh, and OSM sync; enable/disable works.
- Table/panels have loading/empty/error states and meet WCAG AA.

## Outcome (2026-10-03)

Done, and walked by hand in the browser against the local Ward, signed in with
an account holding `prm:admin`.

**Shell** (`ui/app/routes/admin/`):
- `/admin` and `/admin/sources` sit under their own layout: a sidebar with
  Review queue and Sources, the admin's name, and "Back to the site".
- `AppProviders` was pulled out of the public `Layout` so both shells share
  data, language and theme.
- **The gate.** Signed out shows a Ward sign-in prompt that returns to
  `/prm/admin`. Signed in without the grant shows "no access". Ward unreachable
  says so. The server still answers 401/403 on every admin call regardless.
- **Code-split.** The build emits `AdminLayout` (3.7 kB), `review` (25 kB) and
  `sources` (8.5 kB) as their own chunks, which public pages never load. The
  admin *strings* do live in the one i18n dictionary, a few kB every visitor
  downloads. Not worth a second dictionary today.

**Review queue** (`review.tsx`):
- Rows are ordered by confidence. First come unreadable rows (quarantined, with
  their issues), then no place, unsure place (ambiguous), changed, new venue
  (geocoded, a place is created on accept), and ready (already tied to a place).
- Bucket chips with counts filter the table.
- **Ready rows are pre-selected** for one bulk accept. A sticky toolbar holds
  Accept selected and Reject selected; accepting skips anything still without a
  place, and says how many.
- A title opens a **drawer**: a base-ui Dialog, so focus is trapped and
  restored, and Escape closes it. It shows:
  - every field, any issues, and a cancellation notice;
  - a **mini map** with the chosen place, the candidates and any geocoded point
    (it re-measures after the slide-in, which otherwise centred it wrong);
  - the **candidate list** with scores and "Use this place";
  - **"Click the map to drop a pin" → Use this pin**, with the map opening on
    the source's city when there is nothing else to show;
  - Accept (or "Accept the change"), and Reject.

**Sources** (`sources.tsx`):
- Each source shows its mechanism and key and its health. `suspect` and `error`
  are loud; `ok` and never-run are quiet. Also: the last count, the last run,
  and the last success when it differs.
- An enabled checkbox, Refresh per source, and Refresh all, which reports per
  source: read, new, changed, duplicates, unreadable, gone.
- **Add a source**: name, key, an `.ics` URL and the city, which becomes
  `ical:<key>`.
- OSM sync per city, with its result.

**Checked in the browser:**
- A local `.ics` (five events: matched, ambiguous, no venue, `RRULE`, exact
  name) was added through the form and refreshed: "4 read, 4 new, 1
  unreadable".
- The queue showed the buckets as designed.
- Choosing a candidate, then Accept, put the event on public what's on.
- On the unmatched row, a real map click, Use this pin and Accept created a
  `Club Daos` event-venue place with `is_manual_pin = 1`, and its event went
  live.
- Bulk reject reported "Rejected: 1".
- A signed-out browser at `/prm/admin` got the sign-in prompt.

The dev database holds every seeded place twice (the seed plus an OSM sync with
the same names), so exact-name venues came out *ambiguous* there. That is
correct: the matcher will not choose between two identical names. Production
has only the OSM rows.

**Fixed along the way:** quarantined rows now carry their source's name
(`sourcePlatform`), so the queue can say where they came from.

**Tests:** one new e2e spec checks the signed-out gate (the suite is 14). The
signed-in review UI is not under e2e until Ward has an e2e story (brief 17). The
table and drawer use native checkboxes, buttons and a labelled table, so they
are keyboard-reachable. **No formal WCAG audit was run.**

**Not built:** the sidebar's "Places" and "Users" entries ("later" in the
brief).
