import type { Config } from '@docusaurus/types'
import type * as Preset from '@docusaurus/preset-classic'

/**
 * Public Resource Map's documentation site.
 *
 *   • Narrative  → authored in docs/: an orientation page, the HTTP route
 *                  table, the data model, and the ingestion pipeline — the four
 *                  things the corpus does not carry.
 *   • Corpus     → synced by scripts/sync-corpus.mjs into docs/wiki/.
 *   • Reference  → TypeDoc over `shared/`, the Zod schemas and derived types
 *                  that ui and backend both compile against, in static/reference/.
 *   • Diagrams   → archify, from the typed JSON in diagrams/, in static/diagrams/.
 *
 * README.md, getting-started.md and images/ in this folder belong to the repo's
 * README, not the site: only docs/, src/ and static/ are read by the build.
 */

// The deployed base path, baked in rather than injected at deploy time.
//
// vps-deploy ships what this repo already built and VERIFIES this base — it does
// not set it. That is the estate's rule for the case that matters most (Ward's
// UI does the same): a variable the deploy passes that changes nothing is a
// variable that can silently disagree, whereas a value baked here and checked
// there cannot. Build with `npm run docs`; a wrong base fails the deploy by name
// instead of shipping a page whose every asset 404s.
//
// DOCS_BASE still overrides it, for building a copy to serve from somewhere else.
const baseUrl = process.env.DOCS_BASE ?? '/prm/docs/'

const config: Config = {
  title: 'Public Resource Map',
  tagline:
    'A place-centric map of public resources and what is on at them, for Romanian cities — a proof of concept, and honest about being one.',
  url: 'https://gandolh.ro',
  baseUrl,
  // Directory-style URLs (/wiki/overview/ → wiki/overview/index.html), the
  // layout the Starlight site published, so every URL stays where it was.
  trailingSlash: true,
  future: { v4: true },
  onBrokenLinks: 'throw',
  onBrokenAnchors: 'warn',
  markdown: {
    // .md (the synced corpus) parses as CommonMark, .mdx (hand-authored) as MDX.
    // MDX for everything breaks on corpus prose: a bare `<` or `{` is JSX.
    format: 'detect',
    hooks: { onBrokenMarkdownLinks: 'throw' },
  },
  i18n: { defaultLocale: 'en', locales: ['en'] },
  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/', // docs-only site: no /docs/ prefix under the base
          sidebarPath: './sidebars.ts',
        },
        blog: false,
        theme: { customCss: './src/css/custom.css' },
      } satisfies Preset.Options,
    ],
  ],
  // Local, offline search (Starlight shipped Pagefind; Docusaurus ships nothing).
  themes: [
    [
      '@easyops-cn/docusaurus-search-local',
      { hashed: true, docsRouteBasePath: '/', indexBlog: false, indexPages: false },
    ],
  ],
  themeConfig: {
    // Both themes ship, as in the app: ui/DESIGN.md's reason is the use scene —
    // daylight outdoors and a laptop indoors — and both palettes are designed
    // rather than inverted.
    colorMode: { defaultMode: 'light', disableSwitch: false, respectPrefersColorScheme: true },
    navbar: {
      title: 'Public Resource Map',
      items: [
        { href: 'https://github.com/gandolh/public-resource-map', label: 'GitHub', position: 'right' },
      ],
    },
  } satisfies Preset.ThemeConfig,
}

export default config
