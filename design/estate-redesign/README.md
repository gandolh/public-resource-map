# The redesign: "The docked desk"

This folder is the design record of CivicMap's redesign. The estate redesign board, where it was drawn and approved, is a private canvas; this is a copy of the app's page on it plus the build behind that page. The owner approved it on 2026-11-13, and [brief 06](../../corpus/briefs/done/06-a-redesign-with-hallmark-on-the-estate-board.md) built it. The code is now the source of truth: where the app and these files differ, the app wins, and later work may have moved a screen on. Read this folder to see what was decided and why before reshaping a screen.

## The owner's decisions

The owner approved the whole board on 2026-11-13, with every question standing at what the board proposed unless they reopened it. The questions this app's page asked:

- **Ask:** 1. Reopened: B moves three recorded layouts: the search leaves its floating card for a docked band, the place panel moves from the right to a left column, and on the phone a tab bar (Map, What's on, Archive, About the data) stays under the sheet. Is that on the table, or does the map keep today's floating arrangement? 2. The comps draw a quiet street plan; the real app draws CARTO Positron / Dark Matter tiles. Will the CARTO key be in place before the build, or should the build be judged on the filtered OpenStreetMap fallback, which runs warm in dark? 3. Approve The docked desk as CivicMap's direction?
- **Open question:** The judges split on the phone: B's tab bar and one-tap chips against A's bigger map. This blend takes B's navigation and A's map: at 390 x 844 with the sheet at rest the map is 384 px (B's sketch 269). Round 2 sizes the peek from its content, so the first fact is whole at 390 (sheet 239 px) and at 360 x 800 (sheet 267 px, map 312 px, the name wraps). The lens is one compact Anytime chip that opens a three-option select, which brings All, Parks and part of Libraries back on screen; the count sits beside it. Keep the blend?
- **Reopened:** Recorded (decisions-ui.md, "The direction is the category convention"): "floating search, pill filter chips, teardrop pins, a docked side panel on desktop, a draggable bottom sheet on mobile", a permanent exit that future work must not rescue with a novel visual world. Proposed: only the search leaves its floating card for a docked band (with the lens, chips, count and Draw an area); chips, pins, the docked panel and the sheet stay, and no new visual world is added.
- **Reopened:** Recorded (ui/DESIGN.md, Layout): "full-bleed map. Search + filter card top-left (352px), timing lens bottom-centre, place panel docked right (384px, inset 12px)". Proposed: the band above the map holds search, lens and filters; the place panel docks left at 400 px, inset 12 px, and the map runs full-bleed to the right and bottom edges; the controls stay bottom-right, the attribution bottom-left of the map.
- **Reopened:** Recorded (ui/DESIGN.md, Mobile): "a two-snap draggable sheet (peek 0.46 / full 0.82 of the viewport), and a bottom tab bar that hides while the sheet is up", with the lens and a live count below the search. Proposed: the tab bar stays under the sheet, the sheet rests as a peek sized from its content (head, actions, first fact), the lens becomes a compact Anytime chip in the sideways chip row and the count sits beside it; the full snap is not drawn.
- **Reopened:** Recorded (ui/DESIGN.md rule 7): "Small tracked-uppercase labels use `.label-cap` in the UI face." Proposed: none; labels are sentence case in the body face, because tracked capitals fail Hallmark's gate.

Where the files below disagree, the later layer wins: the owner's decisions, then the controller's rulings, then the judges' rulings, then the directions file.

## What is here

| Path | What it holds |
|---|---|
| `directions/public-resource-map.md` | The director's brief: both directions (the winner is the one built), the shared fixture and the screens to draw. |
| `judge/public-resource-map/RESULT.md` | The blind judging against today and the rulings that came with the win. |
| `critiques/public-resource-map-controller.md`, `critiques/public-resource-map.md` | The design critic's review against today, and the controller's rulings over it. |
| `manifests/public-resource-map.tokens.css`, `manifests/public-resource-map.tokens-map.md` | The token hand-off in the app's own names, and the renamed, new and unused tokens. |
| `manifests/public-resource-map.board-notes.md` | What the board said beside the screens: the asks, decisions, reopened rules, open questions, the contrast table and the runner-up. |
| `work/public-resource-map/twins/*.html` | Each drawn screen as static HTML, light and dark: open one in a browser. |
| `work/public-resource-map/shots/` | The twins rendered at 1280 and 390, light and dark, WebP. `direction.webp` is the board's direction sheet. |
| `shots/public-resource-map/` | Today's screens as the board showed them before the redesign. |

People's names and data in the pictures come from seeded demo accounts or are invented.

## Not here

The sketches and the judges' images, the runner-up's build (its notes are in the board's notes), the build's scripts, and the screenshots taken while it was built. They stay in the estate build folder.
