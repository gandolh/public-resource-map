# Brief 33 — Four small fixes from the audit's watch list

> Written 2026-10-06. The owner promoted the [2026-09-27 audit](../../todos/2026-09-27-improvements-audit.md)'s watch list. Four of its items are small and independent, so they share this brief; OSM retirement is [brief 34](34-osm-retires-deleted-places.md), Ward on the public path is [brief 30](30-resolve-ward-only-where-needed.md). Build before or with [brief 31](31-ical-wordpress-shortcodes.md), which starts writing feed URLs.

Each part is separable. Commit them separately.

## 1. URL fields accept only http(s)

`z.string().url()` accepts `javascript:` and `data:`. React 19 refuses `javascript:`
hrefs at render, so nothing is live, but feeds are about to write these fields.

- Files: `shared/src/types/event.ts` (`buyUrl`, `sourceUrl`, `imageUrl`),
  `shared/src/types/place.ts` (`website`), `shared/src/types/ingest.ts` (`buyUrl`,
  `sourceUrl`, `url`).
- One shared `httpUrl` schema (http or https only) used by all seven.
- Test: `javascript:alert(1)` and `data:text/html,…` fail every one; `https://…` passes.

## 2. "Tomorrow" is the next calendar day, not now + 24 h

`ui/app/lib/dates.ts` groups with `addDays(now, 1)` = `now + 86_400_000` ms, so for
the hour around each DST switch "tomorrow" lands on the wrong day.

- Compute day keys by calendar arithmetic in Europe/Bucharest (add one to the
  local date, not 24 h to the instant). The weekend keys on lines 68–69 have the
  same bug; fix them with it.
- Test at both 2026 switches (2026-03-29 and 2026-10-25), at 23:30 and 00:30 local.

## 3. Overpass gets a timeout, and one sync per city at a time

`fetchOverpass` in `backend/src/lib/osm-sync.ts` has no client-side timeout (the
query asks Overpass for `[timeout:90]`, and nothing bounds the HTTP call). Two
syncs of one city at once can collide on the partial unique index and 500 mid-sync.

- An `AbortSignal.timeout` a little above the query's 90 s, surfacing as a clear
  admin error.
- A per-city in-process guard: a second sync of a city that is already syncing gets
  `409` with a message, not a collision.
- Tests for both with the stubbable fetcher.

## 4. The introspection cache evicts

`backend/src/ward/ward.client.ts` keeps one `cache` entry per token and only
ignores expired ones (`expiresAt`), so the map grows until restart.

- Delete an entry when it is read expired, and sweep expired entries on a cheap
  schedule or past a size cap. Say which and why.
- Test: after the TTL passes and a sweep runs, the map is empty.

## Acceptance
- Each part's test above, plus `npm test` and `npm run typecheck`.
- The four items are struck from the audit's watch list with a pointer here, and
  `log.md` has an entry.

## Outcome (2026-10-07)

All four parts shipped as specified, one commit each.

1. **Links.** `httpUrlSchema` in `shared/src/types/common.ts` (named to match the other schemas)
   guards all seven fields. A feed row with another scheme now lands in needs-attention.
   `common.test.ts` runs `javascript:`, `data:` and `https:` through each field.
2. **Tomorrow.** `dates.ts` adds whole days to the Bucharest date (`dayKeyAfter`), and the
   weekday comes from that date too. The new `dates.test.ts` failed three cases on the old code
   (2026-03-28 23:30, 2026-10-25 00:30, and a weekend spanning 03-29) and passes all eight
   instants now.
3. **Overpass.** The HTTP call aborts after 100 s (the query asks for 90 s). The admin gets a
   504 `OVERPASS_TIMEOUT` saying nothing changed. A second sync of a city that is still syncing
   gets a 409 `SYNC_IN_PROGRESS`; another city is not blocked. The guard is a module-level set in
   `osm-sync.ts`, released in `finally`. `buildApp` gained an `osm` option so route tests can stub
   Overpass.
4. **Cache.** An entry read after it expired is deleted, and once per 30 s TTL the next lookup
   sweeps every expired entry. **Chosen: a sweep on a schedule, not a size cap.** A cap needs a
   number picked in advance and, under load, evicts live answers and sends those tokens back to
   Ward. The sweep removes only dead entries. It runs from the lookup path, not a timer, so
   there is nothing to unref or stop and nothing runs while prm is idle. The real client exposes
   `cachedSessions()` for the tests.

Verified: `npm test` 220 passed (176 before), `npm run typecheck` clean.
