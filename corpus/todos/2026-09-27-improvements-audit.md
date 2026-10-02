# Improvements audit — 2026-09-27

A read-only survey of the whole repo (backend, shared, ui, infrastructure,
docs build), vetted against [decisions.md](../wiki/decisions.md) and the
existing brief queue. The winners are written up as briefs 18–28; the rest is
recorded here so it is not rediscovered.

**Scope read:** `backend/src/**`, `backend/drizzle/*.sql` + `meta/`,
`shared/src/**`, `ui/app/**`, `ui/` config, `infrastructure/**`,
`docs/package.json`, root config, `README.md`, the Ward contract
(`wzd_auth/corpus/wiki/integrating.md`) and reference client.
**Skipped:** `node_modules`, build output, generated typegen/snapshots/typedoc.
**Baseline:** `npm test` 54 pass + 3 todo, `npm run typecheck` clean.

**How it ran:** five lens-scoped finder agents were dispatched and all died on
a rate limit before reporting, so the audit was done directly by the
controller. Every finding below was checked by reading the cited lines, and the
starred ones were reproduced by running something.

**Tally:** 26 raw candidates → 11 briefed, 7 watch, 8 dropped.

## Briefed (ranked)

### Now
1. **Anonymous writes** — `POST`/`DELETE /api/places`, `POST`/`DELETE /api/events` carry no guard. → [brief 18](../briefs/done/18-guard-anonymous-write-routes.md)
2. **Events vanish the moment they start** — every surface filters `start_date >= now`, so a running exhibition is invisible for its whole run. → [brief 19](../briefs/done/19-show-in-progress-events.md)
3. ★ **The map silently drops places past 1000** — measured: a real București sync is 3,171 named places. → [brief 20](../briefs/done/20-map-loads-every-place.md)
4. ★ **A JWKS fetch failure reads as "signed out"** — reproduced; breaks the locked 503 semantics and Ward contract rule 5. → [brief 21](../briefs/done/21-ward-jwks-failure-is-unavailable.md)
5. ★ **A fresh clone cannot boot the backend** — reproduced; Ward env required, `.env.example` referenced but absent. → [brief 22](../briefs/todo/22-fresh-clone-setup-path.md)
6. ★ **drizzle-kit has no snapshot for 0001** — reproduced; the next `generate` re-does the Ward cutover. → [brief 23](../briefs/done/23-drizzle-snapshot-for-0001.md)

### Next
7. **A shared place link from the other city shows an empty map** → [brief 24](../briefs/done/24-cross-city-deep-link.md)
8. ★ **OSM catch-all `healthcare` filter imports ~1,000 pharmacies/dentists as "clinic"** in București (measured) → [brief 25](../briefs/done/25-osm-healthcare-taxonomy.md)
9. **The real Ward client has no tests** (279 lines of hand-adapted security code) → [brief 26](../briefs/todo/26-ward-client-test-suite.md)
10. **Ward-cutover leftovers** — dead UI/shared code, `argon2` (native, shipped in the prod image), `@fastify/cookie` → [brief 27](../briefs/todo/27-remove-ward-cutover-leftovers.md)
11. **SPA-template leftovers + pinning-policy breaches** — `@react-router/serve` (root cause of the docs `//cookie` hack), a broken `ui/Dockerfile`, `^` ranges on `jose` and all of `docs/` → [brief 28](../briefs/todo/28-spa-template-leftovers-and-pins.md)

## Watch (named, not spec'd)

- **The public map asks Ward on every request from a signed-in visitor.** The
  root preHandler resolves the session whenever a `ward_session` cookie is
  present — and that cookie is estate-wide (`Path=/`, shared origin), so anyone
  signed into any estate app carries it. "When Ward is down the public map still
  works" holds, but a *slow* Ward (not a refusing one) adds up to the 5s
  introspection/JWKS timeout to public-map requests for those visitors. Resolving
  the session lazily inside the guards and `/api/me` would make the property
  literal. This touches a locked mechanism, so it is logged in
  [open-questions.md](../wiki/open-questions.md), not briefed.
- **Introspection cache never evicts.** `ward.client.ts` stores one entry per
  token and only ignores expired ones; with 15-minute tokens every active
  session adds ~4 entries an hour until restart. Bounded by legitimately minted
  tokens (verification runs first), cleared on every deploy. Matters only at real
  traffic.
- **URL fields accept any scheme.** `z.string().url()` (Zod 3) accepts
  `javascript:` and `data:`. React 19 blocks `javascript:` hrefs at render, so
  there is no live XSS; tighten to http(s) when brief 04's adapters start writing
  scraped URLs (its sanity validation reuses these schemas).
- **OSM re-sync never retires places deleted from OSM.** A closed library stays
  on the map forever. Events have reconcile; OSM has none.
- **`fetchOverpass` has no client-side timeout** and two concurrent syncs of one
  city can collide on the partial unique index (500 mid-sync). Admin-only,
  rare.
- **Seed events are all `endDate: null`** — covered for the multi-day case by
  brief 19, which adds one.
- **UI "tomorrow" grouping adds 24h**, so for one hour around each DST switch
  it picks the wrong calendar day (`ui/app/lib/dates.ts:27-29`).

## Dropped in vetting

- OSM upsert is per-row with no transaction — measured 3,000 places inserted in
  0.9s and re-synced in 0.7s on a scratch DB. Not a problem at city scale.
- A revoked `WARD_APP_KEY` 500-ing the public map — `WardConfigurationError`
  extends `WardUnavailableError`, so the hook already treats it as unavailable.
- `0001_ward_cutover.sql` running with `foreign_keys` effectively on — it drops
  children before parents, so it succeeds either way.
- Stored XSS through `buyUrl` — React 19 neutralises `javascript:` hrefs;
  the phishing-link risk is covered by brief 18.
- `synchronous`/`busy_timeout` PRAGMAs, `(lat,lng)` indexes, viewport fetching,
  canvas markers — already queued in brief 12.
- Missing favorites/notifications/ingestion/admin UI — queued briefs 04/05/16.
- `@react-router/node` and `isbot` "unused" — `@react-router/dev` depends on
  both itself; only `@react-router/serve` is removable (brief 28).
- `mailer.ts` "dead" — brief 05 reuses it for notification email.
