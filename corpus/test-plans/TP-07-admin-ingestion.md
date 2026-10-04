# TP-07 — Admin ingestion

Needs the local Ward and an account holding `prm:admin` (TP-05). For a feed,
serve a local `.ics` file (e.g. `python3 -m http.server`) and add it as a
source. A useful feed has five events:
- one at a seeded place's exact OSM name (`Muzeul de Artă`);
- one ambiguous;
- one at a venue no place matches;
- a recurring one (`RRULE`);
- one with no title (unreadable).

## Goal

Nothing reaches the public until an admin accepts it. A refresh stages a diff,
the queue sorts it by how much judgement it needs, and accept or reject
publishes or drops it. Venues are matched, pinned by hand, or geocoded, and a
source's health is visible.

## Cases

1. **Add a source** (name, key, `.ics` URL, city). It refuses an unknown
   adapter or a key that is taken.
   api `admin-ingest.api.test › sources`; **manual** through the form.
2. **Refresh stages a diff and publishes nothing.** The summary reads "N read,
   N new, … unreadable". The listings sort into matched, ambiguous, geocoded,
   quarantined and duplicate.
   api `… › a refresh stages a diff and publishes nothing`; **manual**.
3. **The queue.**
   - Ordered by confidence: unreadable, no place, unsure place, changed, new
     venue, ready.
   - Ready rows are pre-selected, and the bucket chips filter.
   - **Manual.**
4. **Accept and reject.**
   - Bulk accept publishes only rows that have a place, and says how many it
     skipped.
   - Accepted events appear on what's on.
   - Rejected rows stay rejected on later refreshes.
   - api `… › accept, reject, resolve` (3 tests); **manual**.
5. **Ambiguous match:** choose a candidate in the drawer, then accept. **Manual.**
6. **Manual pin:** on an unmatched row, click the drawer map, use the pin and
   accept. This creates an event-venue place marked as a manual pin. A pin
   outside the city is refused.
   api `… › drops a manual pin only inside the city, …`; **manual**.
7. **Reconcile on a second refresh.**
   - Price and link changes apply silently.
   - A moved start or a cancellation comes back for review.
   - An event missing for 3 days goes stale, and a relisted one comes back.
   - api `… › reconcile on later refreshes` (4 tests).
8. **Dedup:** the same event from a second source is skipped.
   api `… › dedup across sources`.
9. **Health.**
   - An empty run, or one under half the last run, is `suspect`, shown loudly
     on Sources.
   - A failing source is `error`.
   - In production, an adapter that has not cleared the legal posture is
     refused.
   - api `… › source health` (2 tests); **manual**: point a source at an empty
     `.ics`.
10. **OSM sync per city** from Sources reports inserted and updated, and never
    clobbers a manual pin. api `admin-osm.api.test`, `osm-sync.test`.

## Pass criteria

- The api tests named are green.
- Manual cases 1 to 6 and 9 behave as described against the local Ward.
