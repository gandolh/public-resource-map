# Design

> **This page is a pointer, not a spec** (2026-09-04). The authoritative design
> system is **[`ui/DESIGN.md`](../../ui/DESIGN.md)**, derived from the built UI
> rather than written ahead of it. Product truth lives in
> [`ui/PRODUCT.md`](../../ui/PRODUCT.md). The *why* is in
> [decisions.md → Visual direction](decisions.md).

## What happened to the old design system

Everything previously on this page — the CivicMap Material token set (steel blue,
`surface-container-*` scale), **Fraunces + Inter**, the amber accent, the
icon-led teardrop/dot pin spec, CARTO Voyager — described a **"Warmer
Editorial-Civic"** world locked on 2026-06-29. It was never built. On 2026-09-04
the user asked for a total UI/UX rework, and that world was retired as evidence
and anti-reference rather than carried forward.

Four replacement directions were designed and shown as *running coded mockups*:

| Direction | World | Outcome |
|---|---|---|
| Plan Cadastral | A land-registry sheet — numbered parcels, legend-as-filter, a solid-ink title block | Not chosen |
| Rețeaua | The tram diagram in a backlit shelter panel — categories as lines, places as stations, what's-on as a departure board | Not chosen |
| Cursa | Orienteering — inviolate terrain, one overprint ink for everything the user touches | Not chosen |
| **The standard** | The category convention, played straight | **Chosen** |

The user took the standing exit deliberately, asking for the convention
"or even better", with **Citymapper and Linear** as the craft bar. Convention is
therefore the commitment — see
[decisions.md → Visual direction](decisions.md) for the binding rules.

## The short version of the built system

- **Neutrals** are cool-biased, not inherited grey. **One** blue accent.
- **Eleven `PlaceCategory` hues carry information**, always paired with an icon
  and a written label — colour is never the only signal. `EventCategory` reuses
  the same eleven rather than adding a second palette.
- **A 1px border is the default separator.** Shadow is spent only on what
  genuinely floats, and differs by role (chrome / overlay / panel / pin).
- **Radii cap at 12px.** Pills are reserved for filter chips and badges.
- **Archivo**, one family, tabular numerals wherever digits align. Monospace
  only for real identifiers.
- **Both themes ship**, because the use scene is daylight outdoors *and* a
  laptop indoors.
- Motion is 120–240ms, ease-out, no bounce.

Tokens, component anatomy and the full scale: **[`ui/DESIGN.md`](../../ui/DESIGN.md)**.
