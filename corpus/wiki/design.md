---
name: CivicMap
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daef'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e9edff'
  surface-container-high: '#e1e8fd'
  surface-container-highest: '#dce2f7'
  on-surface: '#141b2b'
  on-surface-variant: '#41474f'
  inverse-surface: '#293040'
  inverse-on-surface: '#edf0ff'
  outline: '#717880'
  outline-variant: '#c1c7d0'
  surface-tint: '#206393'
  primary: '#1c6090'
  on-primary: '#ffffff'
  primary-container: '#3c79ab'
  on-primary-container: '#fdfcff'
  inverse-primary: '#96ccff'
  secondary: '#4c6075'
  on-secondary: '#ffffff'
  secondary-container: '#cfe5fd'
  on-secondary-container: '#52667b'
  tertiary: '#7d5400'
  on-tertiary: '#ffffff'
  tertiary-container: '#9a6c17'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cee5ff'
  primary-fixed-dim: '#96ccff'
  on-primary-fixed: '#001d32'
  on-primary-fixed-variant: '#004a75'
  secondary-fixed: '#cfe5fd'
  secondary-fixed-dim: '#b3c9e0'
  on-secondary-fixed: '#061d2f'
  on-secondary-fixed-variant: '#34495c'
  tertiary-fixed: '#ffddb0'
  tertiary-fixed-dim: '#f6bc62'
  on-tertiary-fixed: '#281800'
  on-tertiary-fixed-variant: '#614000'
  background: '#f9f9ff'
  on-background: '#141b2b'
  surface-variant: '#dce2f7'
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style

The design system is built on a foundation of **Civic Modernism**. It balances the authoritative reliability of a government institution with the fluid, accessible utility of a contemporary digital product. The primary goal is to foster community engagement by making complex urban data navigable and inviting.

The aesthetic follows a **Minimalist-Professional** approach:
- **Trustworthy:** Clear structures and consistent patterns reassure the user.
- **Accessible:** High-contrast ratios and clear affordances ensure the app is usable by all citizens.
- **Clean:** Generous whitespace and a "lightweight chrome" philosophy keep the focus on the data and the map.
- **Functional:** Information density is carefully managed to avoid overwhelm while remaining useful for local discovery.

## Colors

The palette is designed for high legibility and rapid category recognition. 

### Semantic System
- **Steel Blue (--color-primary):** Used for navigation, primary actions, and branding. It conveys stability.
- **Category Colors:** Each category (Park, Healthcare, etc.) uses a distinct, accessible hue. These should be paired with 10% opacity backgrounds for badges to ensure text legibility.
- **Neutral Scale:** Utilizes a systematic grey scale for secondary text and borders, moving from #F9FAFB (Background) to #111827 (Primary Text).

### Color Implementation
- **Active States:** Use `primary_color_hex` at 100% opacity for text and icons.
- **Inactive States:** Use neutral greys to de-emphasize non-essential chrome.
- **Category Pairing:** When using category colors on text, ensure a contrast ratio of at least 4.5:1 against the surface.

## Typography

This design system utilizes **Inter** exclusively to leverage its exceptional legibility and systematic weights. 

- **Hierarchy:** Use bold weights for location titles and regular weights for descriptions.
- **Labels:** Small labels (`label-sm`) should use a slightly increased letter spacing (0.05em) and uppercase styling for "Utility" text like timestamps or distances.
- **Line Heights:** Generous line heights are maintained to ensure readability for users with varying visual abilities.
- **Optical Sizing:** For large display text, use negative letter-spacing to maintain a "tight" professional appearance.

## Layout & Spacing

The design system employs a **Fluid-Fixed Hybrid** grid. The map occupies the full viewport, while interface overlays (drawers, search bars) adhere to a strict 4px baseline grid.

### Breakpoints & Reflow
- **Mobile (< 768px):** Elements like "Detail Drawers" become bottom sheets. Margins are reduced to 16px.
- **Desktop (>= 1024px):** A fixed-width (400px) detail panel slides from the right, with a 40px margin from the screen edge.
- **Spacing Rhythm:** Use `md` (16px) for standard internal padding within cards and `lg` (24px) for spacing between distinct sections.

## Elevation & Depth

Visual hierarchy is established through **Tonal Layers** and **Low-Contrast Outlines**.

- **Level 0 (Base):** The map layer.
- **Level 1 (Cards/Search):** Uses a subtle 1px border (`#E5E7EB`) and a very soft, diffused shadow (0px 4px 6px rgba(0,0,0,0.05)) to separate content from the map.
- **Level 2 (Active Drawer/Modals):** Increased shadow depth (0px 10px 15px rgba(0,0,0,0.1)) to indicate focus.
- **Surface Contrast:** In dark mode, depth is communicated by shifting from a background of `#111827` to a surface of `#1F2937` rather than using heavy shadows.

## Shapes

The shape language is **Rounded**, conveying a modern and friendly civic tone.

- **Standard Elements:** Buttons, cards, and input fields use 0.5rem (8px).
- **Large Elements:** Detail drawers and modals use 1rem (16px) on top corners.
- **Pills:** Filter chips and category badges use a full border-radius (9999px) to distinguish them as interactive or metadata elements.

## Components

### Map Pins
- **Structure:** 32px circular base.
- **Styling:** White border (2px) with the interior filled with the category color. A white icon is centered within.
- **Interaction:** Scale up to 40px when hovered or selected.

### Event Cards
- **Structure:** Horizontal or vertical layout depending on container width.
- **Elements:** 1:1 or 16:9 aspect ratio image, title (`headline-md`), date/time (`label-md`), and a category badge.
- **Styling:** White background, 1px neutral border.

### Filter Chips
- **Inactive:** Transparent background, 1px border (#D1D5DB), neutral text.
- **Active:** Primary color background, white text, no border.

### Detail Drawer
- **Desktop:** Slides from the right. Full height. Contains header image, action buttons (Get Directions, Share), and long-form markdown text for descriptions.
- **Mobile:** Bottom sheet with a "drag handle" affordance at the top.

### Sliders (Radius Selector)
- **Track:** 4px height, neutral-grey background.
- **Active Track:** Primary steel blue.
- **Thumb:** 24px circle, primary blue, with a subtle elevation (Level 1 shadow).

### Category Badges
- **Styling:** Background set to category color at 10% opacity. Text color is the category color at full value. Includes a 6px solid color dot on the left of the text label.