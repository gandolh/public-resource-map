# Stitch Screens — CivicMap Reference Implementations

_Captured: 2026-06-26 — source was `stitch_output/stitch_civic_mapper/` (now deleted from root)._

Four HTML reference screens were generated from the Stitch brief. They share the same CivicMap token set (see [design.md](design.md)) but differ in layout and state. The originals are removed; this page preserves all structural and pattern notes needed for implementation.

---

## Screen 1 — Home / Map (Light Mode)

**File was:** `civicmap_home_light/code.html`  
**Screenshot:** `civicmap_home_light/screen.png`

### Layout

- Full-bleed map (`h-[calc(100vh-64px)]`, `overflow-hidden`) below a fixed 64px top navbar.
- Search + filter overlay sits `absolute top-md left-md` on the map, `w-[400px]` on desktop, full-width on mobile.
- Detail drawer (`w-[400px]`) is `absolute right-0 top-0 h-full` on desktop, hidden on mobile.
- Mobile bottom sheet replaces the drawer with a `rounded-t-xl` panel at the bottom, with a drag handle (`w-12 h-1.5 bg-outline-variant`).

### Search Bar

```
bg-surface rounded-full border border-outline-variant px-md py-sm flex items-center gap-sm h-12
```
- Material Symbol `search` icon in `text-outline`.
- `placeholder="Search CivicMap"`.

### Filter Bar

```
bg-surface rounded-lg border border-outline-variant p-md flex flex-col gap-sm
```
- Category chips: inactive = `border border-outline-variant bg-transparent`; active = `bg-primary text-on-primary border-none`.
- Radius slider: track `h-1 bg-outline-variant rounded-full`; active track `h-1 bg-primary`; thumb `w-6 h-6 bg-primary rounded-full shadow`.

### Map Pins

| Type | Size | Color | Icon |
|---|---|---|---|
| User location | w-6 h-6 | `bg-surface-tint` | pulsing dot (`pulse-dot` animation) |
| Park | w-8 h-8 | `#10b981` (green) | `park` (filled) |
| Event | w-8 h-8 | `#8b5cf6` (purple) | `event` (filled) |
| Library (selected) | w-10 h-10 | `bg-tertiary-container` | `menu_book` (filled), extra ring |

Pin base classes: `rounded-full border-2 border-on-primary flex items-center justify-center shadow-sm cursor-pointer hover:scale-125 transition-transform`

### Detail Drawer (Desktop)

```
w-[400px] absolute right-0 top-0 h-full bg-surface border-l border-outline-variant shadow-[0_10px_15px_rgba(0,0,0,0.1)]
```
- Header image: `h-48 object-cover`, close button top-right.
- Category badge: `bg-{color}/10 px-2 py-1 rounded` + color dot + `uppercase tracking-wider text-label-sm`.
- Title: `text-headline-lg`.
- Address row: `material-symbols-outlined location_on` + `text-body-md`.
- Hours row: open status in `#10b981` green.
- Divider: `h-px w-full bg-outline-variant`.
- Footer: sticky `p-lg border-t border-outline-variant`, full-width primary button.

---

## Screen 2 — Home / Map (Dark Mode) — Event Drawer

**File was:** `civicmap_home_dark/code.html`  
**Screenshot:** `civicmap_home_dark/screen.png`

This screen shows the **dark mode** map + an open event detail drawer. It also uses a **side navigation panel** (desktop) replacing the top navbar.

### Dark Mode Map

- Body: `bg-gray-900`; map bg uses a CSS dark grid pattern.
- Map pins: glowing effect via `box-shadow: 0 0 12px rgba(150, 204, 255, 0.6)`.
- Pin colors in dark: `bg-primary-fixed-dim` (light blue), `bg-tertiary-fixed-dim` (amber), `bg-secondary-fixed-dim` (steel).

### Side Navigation (Desktop, Dark)

```
hidden lg:flex flex-col h-full fixed left-0 top-0 w-[400px] bg-surface-container border-r border-outline-variant
```
- Logo + "City Services Portal" subtitle.
- Search input inside nav.
- Filter chips row below search.
- Nav items: Map, Events, Resources, Saved — with filled icon + label.
- Footer: theme toggle + avatar.

### Mobile Bottom Nav

```
fixed bottom-0 w-full h-[72px] bg-surface border-t border-outline-variant flex justify-around
```
- Items: Map (active = `bg-primary-container pill`), Events, Saved.
- Label: `text-label-sm`.

### Event Drawer (Dark Mode)

```
absolute right-0 top-0 h-full w-full md:w-[400px] bg-[#1F2937] rounded-xl shadow-[0px_10px_15px_rgba(0,0,0,0.5)] border border-gray-700
drawer-slide-in animation (translateX from 100% to 0)
```
- Header image: `h-48`.
- Category badge: `bg-purple-900/80 text-purple-200 border border-purple-700/50 backdrop-blur-sm`.
- Title: `text-headline-lg-mobile md:text-headline-lg text-white`.
- Date + price row: `text-label-md text-gray-300`, price in `text-primary-fixed-dim font-bold`.
- Action row: Directions button (outlined) + Share icon button.
- Sticky footer: full-width `bg-primary-fixed-dim text-gray-900` button.

---

## Screen 3 — Events List

**File was:** `civicmap_events_list/code.html`  
**Screenshot:** `civicmap_events_list/screen.png`

### Layout

- Standard page (not full-bleed map). `min-h-screen flex flex-col`.
- Main: `pt-24 px-margin-mobile md:px-margin-desktop pb-xl max-w-7xl mx-auto`.
- Header: title (`text-display` desktop / `text-headline-lg-mobile` mobile) + result count.
- Filter row: Category dropdown, Date picker, Price dropdown, active chip with close `×`.
- Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg`.

### Event Card

```
bg-surface rounded-xl overflow-hidden border border-outline-variant shadow-sm flex flex-col
hover: translateY(-4px) + deeper shadow
```
- Image: `h-48 object-cover w-full`.
- Category badge: absolute `top-4 left-4`, `rounded-full px-3 py-1`, background = category color.
- Title: `text-headline-md line-clamp-2`.
- Date row: `calendar_month` icon + date string.
- Location row: `location_on` icon + venue name.
- Footer: divider + price (left) + `arrow_forward` icon (right).

### Active Filter Chip

```
bg-primary-container text-on-primary-container rounded-full px-4 py-2 text-label-sm flex items-center gap-2
```
Removable via `close` icon.

### Pagination

- Prev/Next: `w-10 h-10 rounded-lg border border-outline-variant`.
- Active page: `bg-primary text-on-primary`.
- Ellipsis: plain text.

---

## Screen 4 — Resource Detail

**File was:** `civicmap_resource_detail/code.html`  
**Screenshot:** `civicmap_resource_detail/screen.png`

### Layout

- Standard page. `pt-16` body offset for fixed navbar.
- Main: `max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-lg space-y-lg`.
- Content split: `grid-cols-1 lg:grid-cols-3` — description + map embed (left, `col-span-2`) | info sidebar (right).

### Breadcrumb

```
flex items-center text-label-md text-on-surface-variant
```
Chevron separator: `material-symbols-outlined text-sm`.

### Hero Section

```
rounded-xl overflow-hidden bg-surface-container border border-outline-variant shadow-sm
```
- Image: `h-64 md:h-96 bg-cover bg-center`.
- Overlay: `bg-gradient-to-t from-inverse-surface/80 to-transparent absolute bottom-0`.
- Title: `text-display text-on-primary` (white, on dark overlay).
- Category badge: `bg-primary-container text-on-primary-container rounded-full text-label-sm`.
- Get Directions button: `bg-primary text-on-primary px-lg py-md rounded-lg`.

### Description Card

```
bg-surface rounded-xl border border-outline-variant p-lg shadow-sm
```
`text-body-lg text-on-surface-variant space-y-md`

### Map Embed

```
bg-surface rounded-xl border border-outline-variant overflow-hidden shadow-sm h-[400px]
```

### Contact Info Card

- Phone/website rows: `w-10 h-10 rounded-full bg-surface-container` icon container + link.
- Icons: `call`, `language`.

### Hours Card

- List rows: `flex justify-between py-xs border-b border-outline-variant/30`.
- Closed day: `text-outline` (muted).

### Accessibility Card

- Rows: icon (`text-primary`) + description text.
- Icons: `accessible`, `elevator`, `hearing`.
