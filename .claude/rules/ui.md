---
paths:
  - "ui/app/**"
---

# The UI (`ui/app`)

- Read the `base-ui` skill before you add or change a component, and
  [corpus/wiki/decisions-ui.md](../../corpus/wiki/decisions-ui.md) for the design.
- Base UI is imported only under `ui/app/components/ui/` (one wrapper per primitive), from subpaths, and feature code uses
  the wrapper. `check-base-ui` is strict in `npm run check:conventions`.
- Tailwind 4 on `ui/app/app.css`, the one stylesheet, in layers: `theme, base, vendor, components, utilities`. Leaflet's CSS
  is `layer(vendor)`; the app's Leaflet and pin rules are in `components`, with no `!important` but the reduced-motion rule.
  Only the two token blocks sit outside a layer.
- Tokens come from `app.css`: colours (`--color-*`), the named type scale (`text-meta`, never `text-[13px]`), the z scale
  (`z-popup`, never `z-[1000]`), `--dur-*` and `ease-out-fast`. A new token's name also goes into `cn()` in
  `ui/app/lib/utils.ts`. A category hue reaches an element through `catVar()` and `--cat`, not an inline colour.
- Dark mode is `data-theme="dark"` on `<html>` (Light is the first visit; System follows the operating system). `dark:` keys
  off it through `@custom-variant`; the boot script in `root.tsx` sets it before paint. Never `prefers-color-scheme` in a
  component, and never a `dark` class.
- A one-of-several choice kept on the device is a `RadioGroup` (`Segmented`, the language switch); the archive's panels are
  `Tabs`; filters are `Toggle` chips. A picker that saved to the server would be a guarded `ToggleGroup`.
- A trigger around one of our components uses `render`, never a wrapping `span` or `div`.
- Every dialog goes through `Dialog` (the Escape guard, initial focus); the place sheet is the non-modal `BottomSheet`. No
  `window.confirm`, `alert` or `prompt`.
- User-facing text goes through `useI18n()` in both Romanian and English (`ui/app/lib/i18n.tsx`).
- The map's pins are HTML strings in `ui/app/components/map/PlaceMarkers.tsx`, so their classes live in `app.css`.
- Route modules use `clientLoader`, never `loader` (the app is a single-page build).
- Default exports only for React Router's entry files (`root.tsx`, `routes.ts`, `Layout.tsx`, `routes/**`).
