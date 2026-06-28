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
