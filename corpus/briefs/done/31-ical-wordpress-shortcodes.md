# Brief 31 — Strip WordPress shortcodes from iCal descriptions, and keep the ticket link they carry

> Written 2026-10-06. The owner approved Filarmonica Banatul and Teatrul Național Timișoara as the first event sources, **with descriptions** ([decisions.md](../../wiki/decisions.md)). Build before adding Teatrul Național, or its events show raw shortcode text.

## Context

Both feeds are The Events Calendar's `?ical=1` export, which `backend/src/ingest/ical.ts`
already parses. Teatrul Național's `DESCRIPTION` carries WordPress shortcodes from a
button plugin, verbatim:

```
O SCRISOARE PIERDUTĂ\n\n[DKB url="https://www.eventim.ro/event/o-scrisoare-pierduta-teatrul-national-mihai-eminescu-22097293/" text="Cumpără bilet" title="Cumpără bilet" type="large" style="gradient" color="red" ... nofollow="yes"]\n\n[DKB ...
```

`toRow` keeps `description` as-is, so every one of those events would show the
shortcode as text. The `url` inside it is the source's own ticket link. The locked
rule (decisions.md: "a buy-tickets link is shown only if that public source itself
provides one") makes it a legitimate `buyUrl`.

## Files you OWN
- `backend/src/ingest/ical.ts` and `backend/src/ingest/ical.test.ts`

## What to do
1. In `toRow`, remove WordPress shortcodes from the description: bracketed
   `[name attr="…" …]` tags and their closing `[/name]` forms. Collapse the blank
   lines this leaves, and drop a description that ends up empty.
2. When a removed shortcode has a `url="https://…"` attribute and the row has no
   `URL`-derived buy link yet, set `raw.buyUrl` to the first such URL. Accept only
   `https:` (the audit's "URL fields accept any scheme" watch item applies here).
3. Do not touch text in square brackets that isn't shortcode-shaped, such as
   "[sold out]" (no attributes, no closing tag).

## Acceptance
- A test using the excerpt above: the description is `O SCRISOARE PIERDUTĂ`, and
  `buyUrl` is the eventim URL.
- A test where a description's only content is a shortcode: no description.
- A `javascript:` URL inside a shortcode is never lifted.
- `npm test` and `npm run typecheck` pass.

## Owner steps after it lands
In production's admin, Sources → Add a source, twice, city Timișoara, mechanism `ical`:
- `ical:filarmonica-banatul`, `https://filarmonicabanatul.ro/evenimente/?ical=1`
- `ical:teatrul-national-timisoara`, `https://www.tntm.ro/?ical=1`

Then refresh each and review the diff. Filarmonica's `LOCATION` is a full address,
so expect venue rows in review until a place is chosen or pinned.

## Outcome (2026-10-07)

Shipped in `ical.ts` as specified. `stripShortcodes` removes a bracketed tag that has
`name="value"` attributes, is a closing `[/name]`, or opens a tag closed later in the text.
"[sold out]" and "[Premieră] …" stay. The first `https:` `url` from a removed shortcode becomes
`buyUrl`; `javascript:` and `http:` links are never lifted. Blank lines collapse, each line is
trimmed, and an empty description is dropped.

The real feed differs from the excerpt above in three ways, all handled or noted:
- A second `[DKB …]` links to a questionnaire (questionpro.eu). The ticket button always comes
  first, so "first https URL" picks eventim.
- Seven events carry `&nbsp\;` on a line of its own. It would have shown as literal text, so it
  now counts as a space. No other HTML entity appears in either feed.
- Every TNTM description ends with "Regulamentul spectatorului", the leftover text of a link to
  the theatre's rules. It is not a shortcode and stays. Worth a look if it reads badly.

Verified: the brief's three cases plus enclosing tags and plain brackets in `ical.test.ts`.
Both approved feeds, fetched once on 2026-10-07 and run through `parseIcal` and
`rawEventSchema`: TNTM 25 events, all valid, all with an eventim `buyUrl`, no shortcode text
left; Filarmonica 30 events, all valid, unchanged. `npm test` 226 passed, `npm run typecheck`
clean.

The owner steps above (adding the two sources in production's admin) are still to do.
