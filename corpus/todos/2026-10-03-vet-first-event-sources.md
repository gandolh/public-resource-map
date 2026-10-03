# Vet and add the first event sources — 2026-10-03

Brief 04's pipeline is built; it has no source. Choosing sources is a legal and
editorial call, not a build step, so it is the owner's.

**For each candidate** (Centrul de Proiecte Timișoara, timisoara-info.ro,
individual museums and theatres in Timișoara and București; never a commercial
aggregator):

1. **Probe API-first** (decisions.md): an official API, then an `.ics` feed
   (often unadvertised: try `/calendar.ics`, `?ical=1`, WordPress "The Events
   Calendar" `?ical=1`, Google Calendar public links), then RSS, JSON-LD, a
   sitemap. Record what was found.
2. **Read the terms.** Reuse permitted? Attribution required? Write the verdict
   down, as was done for iaBilet.
3. **If it has an iCal feed:** `POST /api/admin/sources` with
   `{ name, adapterKey: "ical:<slug>", mechanism: "ical", url, city }`, then
   refresh it and review the diff. No code is needed.
4. **If it only has HTML:** that is a site-specific adapter (`SourceAdapter` in
   `backend/src/ingest/adapters.ts`), worth writing only for a source that is
   worth it, with `productionAllowed` false until its terms are cleared.

Before the first real refresh in production, set `NOMINATIM_USER_AGENT` with a
real contact, or every unmatched venue waits for a manual pin.
