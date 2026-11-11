---
paths:
  - "ui/app/**"
---

# The UI (`ui/app`)

- Read the `base-ui` skill before you add or change a component, and
  [corpus/wiki/decisions-ui.md](../../corpus/wiki/decisions-ui.md) for the design.
- Base UI is meant to be used only through the wrappers in `ui/app/components/ui/`, from subpaths. Three files
  still import it directly (`check-base-ui` lists them); add no more.
- Tokens come from `ui/app/app.css`, and colour from the `--color-*` tokens, never a raw value.
- A trigger around one of our components uses `render`, never a wrapping `span` or `div`.
- User-facing text goes through `useI18n()` in both Romanian and English (`ui/app/lib/i18n.tsx`).
- The map's pins are HTML strings in `ui/app/components/map/PlaceMarkers.tsx`, so their classes live in `app.css`.
- Route modules use `clientLoader`, never `loader` (the app is a single-page build).
- Default exports only for React Router's entry files (`root.tsx`, `routes.ts`, `Layout.tsx`, `routes/**`).
- `npm run check:conventions` runs `check-base-ui` over this folder, `--warn-only` for now.
