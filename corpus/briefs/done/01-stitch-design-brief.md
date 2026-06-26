# Design Brief — Public Resource Map

## What it is

A **web application** that helps people discover nearby public resources (parks, libraries, community centers, healthcare, food banks, shelters, etc.) and local events (concerts, festivals, workshops, theater, sport) through an **interactive map**. The user opens the app, grants location access, and sees pins on a map centered on their city. They can click a pin to see details, filter by category, adjust the search radius, and — for events — follow a link to the original ticketing platform.

**Target audience**: urban residents who want to know what's around them — community-minded people who may not know what resources exist near them, locals looking for weekend things to do, newcomers to a city.

**Tone**: helpful, civic, approachable. Not corporate. Not flashy. Trustworthy like a community bulletin board, but clean and modern.

---

## Screens to design

### 1. Home / Map (primary screen)

The map fills most of the viewport. A persistent top navbar sits above it.

**Key elements:**
- Full-bleed interactive map (the hero of the experience)
- Map pins differentiated by type (resource vs. event) and category (color-coded or icon-coded)
- A **filter bar** or collapsible panel: category chips (park, library, concert, workshop, …), radius slider, date range for events
- A **detail drawer / side panel** that slides in from the right (or bottom on mobile) when a pin is selected — shows: name, category badge, address, opening hours (resources) or date/time/price (events), description, a CTA button ("Get Directions" or "View Event")
- User's location indicator on the map (pulsing dot)
- A search input to jump to a different location

### 2. Navbar (persistent, across all screens)

- App logo / wordmark: "Public Resource Map" or a shorter brand name
- Nav links: Map, Events (future: Resources as its own page)
- Theme toggle (dark / light)
- Profile avatar dropdown (Account, Settings, Sign out)

### 3. Events list page (secondary screen)

An alternative to the map view — a card grid of upcoming events, sortable/filterable.

**Key elements:**
- Event cards: image thumbnail, title, category badge, date, location, price (or "Free")
- Filter sidebar or top filter row: category, date range, price
- Pagination or infinite scroll

### 4. Resource detail page (secondary screen)

A full page for a single resource, reached from the map pin or a future resources list.

**Key elements:**
- Hero: name, category, address, opening hours
- Map embed showing location
- Description
- Contact info (phone, website)
- "Get Directions" CTA

---

## Visual direction

### Feeling

**Civic but contemporary.** Think: a modern city app made by people who care about their community, not a corporate product. Clean whitespace. Purposeful use of color to communicate category (not decoration). Accessible.

### Color palette ideas

- **Background**: near-white in light mode, deep dark-grey (not pure black) in dark mode
- **Accent / primary**: a grounded, civic blue — not electric, something like a steel blue or slate blue
- **Category colors**: a small system of 6–8 distinguishable, accessible colors for resource/event categories (park = green, healthcare = red/coral, library = amber, events = purple, etc.)
- **Surface / card**: subtle elevation — light grey in light mode, slightly lighter dark in dark mode

### Typography

- Clean geometric or humanist sans-serif. **Inter** is already loaded (web font).
- Clear hierarchy: large map is the hero, so UI chrome should feel lightweight — small/medium text sizes, generous whitespace, thin strokes.

### Map style

- The map tile style should complement the app palette — a neutral/muted base map (not satellite) so pins and UI elements read clearly.
- Light mode: light grey base map (e.g. Stamen Toner Lite, or Mapbox Light)
- Dark mode: dark muted base map (e.g. Mapbox Dark, or CartoDB Dark Matter)

### Components to design

1. **Map pin** — two variants: resource and event. Needs to be distinguishable by shape and color at a glance. Small (≤32px) but readable. Consider a circle with a category icon inside.
2. **Category badge / chip** — inline label with a color dot or background tint. Used in cards, detail panels, filter bars.
3. **Filter chip** (selectable) — active vs. inactive state clearly distinct.
4. **Detail drawer** — right panel on desktop, bottom sheet on mobile. 360–420px wide on desktop. Clean card feel, prominent CTA button.
5. **Event card** — image + metadata. Compact enough for a 3-column grid on desktop.
6. **Radius slider** — custom or well-styled range input, showing distance label.
7. **Empty state** — "No resources found in this area" — friendly, helpful (suggest expanding radius or changing filter).

---

## Implemented vs. to-do (for context)

### Already implemented

- App shell: navbar with Home/Events links, theme toggle (dark/light/system), profile dropdown
- Component library: Button (6 variants), Avatar, DropdownMenu (Radix UI)
- Theme system: CSS custom properties, OKLCH color tokens, localStorage persistence
- Data model: Resource and Event types with categories, coordinates, metadata

### Not yet implemented (design needed to unblock)

- Interactive map view (library not chosen — Leaflet or Mapbox)
- Map pins / markers
- Filter bar / panel
- Detail drawer / side panel
- Events list page
- Resource detail page
- Auth screens (login, registration) — lower priority

---

## Constraints

- **Responsive**: desktop-first, but must work on mobile (especially the map + detail drawer)
- **Dark mode**: full dark/light theme required — design both
- **Accessible**: WCAG AA minimum — color contrast, keyboard nav, focus states
- **Framework**: React 19, Tailwind CSS 4, shadcn/ui (Radix UI primitives) — design should be implementable with these tools
- **Font**: Inter is already loaded; prefer to keep it or choose something pairable

---

## What to generate

1. **Light + dark mode** of the home/map screen (primary deliverable)
2. **Detail drawer** open state (resource and event variants)
3. **Filter panel** showing active filters
4. **Events list page** (light mode minimum)
5. **Map pin** designs for each category
6. **Color palette + token sheet** with named variables (primary, surface, border, category colors)
7. **Component inventory**: badge, chip, card, button states

**Format**: Figma frames or component library preferred. Export tokens as CSS custom properties if possible, named to match the existing `app.css` pattern (`--color-primary`, `--color-surface`, etc.).
