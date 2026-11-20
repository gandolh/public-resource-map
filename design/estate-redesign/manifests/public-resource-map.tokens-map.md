# CivicMap tokens: board role to app token

Mechanism: the app's own two raw blocks (`:root` and `:root[data-theme="dark"]`) plus the `@theme inline` role aliases. The board's `--color-*` names are the app's aliases, so every board role already sits under an app name; only values change, and a few names are new.

## Renamed or remapped (board role to app token)
- ground (board `--color-bg`) -> `bg`, deeper than today so the band and the column stand off it: light `#f7f9fb` -> `#e8ecf1`, dark `#0b0d11` -> `#090b0f`
- surface -> `surface`: light stays `#fcfdfe`, dark `#14171d` -> `#1c212b`; `surface-2`, `surface-3`, `line` (light `#d8dee6`, 1.33 on surface) and `line-strong` take new values in both themes
- ink -> `fg`: `#0d1117` (GitHub's canvas to the digit) -> `#131922`; `fg-muted` and `fg-faint` re-tuned to 5.56 or more on surface and 4.6 or more on `bg`
- on-accent -> `fg-on-accent`: `#ffffff` -> `#fbfcff` (Hallmark gate 7b)
- focus ring -> `accent` (the board draws the ring in the accent, so no `focus` token)
- accent-weak, accent-line: new values (`#e9effe`, `#c3d2fb` light; `#1d2b4d`, `#2f4474` dark); used for the chosen menu row and text selection
- pin glyph and edge -> existing `pin-ico`, `pin-stroke` (now `#fbfcff`)
- shadows -> `sh-1`, `sh-2`, `sh-3` (aliased `shadow-e1..e3`): same roles, now tinted from `fg` (`rgba(19,25,34,...)`) instead of `rgba(13,17,23,...)`; dark values deepen
- type: sizes fold into six: `text-meta` 12/16, `text-ui` 13/18, `text-body` 14/20, `text-hero` 30 -> 28/34; `text-title` 17, `text-heading` 19 and the others are no longer used by these screens (see below)
- radii: unchanged (`radius-md` 8 for controls, `radius-lg` 10 for the lens, `radius-xl` 12 for cards; the pill is Tailwind's `rounded-full`, for chips and badges only)

## New tokens (component that needs them)
- `outline` (+ alias `color-outline`): the edge of the search field, Copy link, the star, Draw an area and the sheet's grab bar (3.52 light, 4.32 dark on surface; 3.13 and 3.37 or more on the hued head)
- `map-land`, `map-block`, `map-road`, `map-park`, `map-trail`, `map-water`, `map-label` (+ aliases): the plan behind the pins; the code brief decides whether they style the OpenStreetMap fallback (`.map-fallback`) or only the demo
- `head-mix` (7% light, 12% dark, raw, no alias): how much of the place's hue tints the head of the place card, as `color-mix(in srgb, var(--hue) var(--head-mix), var(--surface))`
- `text-field` 16/24: phone inputs and the phone's event titles; `text-place` 22/28: the place title in the column and the sheet (600, -0.015em)
- line-height entries (`--text-*--line-height`) for the six sizes in use

## App tokens the design no longer uses (keep or drop is the code brief's call)
- `text-nano`, `text-micro`, `text-tag`, `text-note`, `text-caption`, `text-detail`, `text-control`, `text-reading`, `text-lead`, `text-title`, `text-heading`, `text-headline`, `text-display`: the screens use only 12, 13, 14, 16, 22 and 28 (the whole app shares them, so check the other screens before dropping)
- `ok-weak`, `warn`, `danger-weak`: not drawn here (`danger` is used for error text)
- `map-scrim`, `sh-pin`: the drawn pins carry no shadow and no scrim sits on the plan
- `--animate-panel-in` slides from the right (translateX(10px)); the column now docks left, so its keyframe reverses to translateX(-10px)
- `.label-cap` (ui/DESIGN.md rule 7, tracked capitals): dropped
