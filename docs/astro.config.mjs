// @ts-check
import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'

/**
 * Public Resource Map's documentation site.
 *
 *   • Narrative  → authored here: an orientation page, the HTTP route table,
 *                  the data model, and the ingestion pipeline — the four things
 *                  the corpus does not carry.
 *   • Corpus     → synced by scripts/sync-corpus.mjs into src/content/docs/wiki/.
 *   • Reference  → TypeDoc over `shared/`, the Zod schemas and derived types
 *                  that ui and backend both compile against.
 *   • Diagrams   → archify, from the typed JSON in diagrams/.
 *
 * Deployed at https://gandolh.ro/prm/docs/. `base` is "/" locally; vps-deploy
 * passes DOCS_BASE.
 */
// The deployed base path, baked in rather than injected at deploy time.
//
// vps-deploy ships what this repo already built and VERIFIES this base — it does
// not set it. That is the estate's rule for the case that matters most (Ward's
// UI does the same, see vps-deploy/stacks/ward.ts): a variable the deploy passes
// that changes nothing is a variable that can silently disagree, whereas a value
// baked here and checked there cannot. Build with `npm run docs`; a wrong base
// fails the deploy by name instead of shipping a page whose every asset 404s.
//
// DOCS_BASE still overrides it, for building a copy to serve from somewhere else.
const base = process.env.DOCS_BASE ?? '/prm/docs/'

export default defineConfig({
  base,
  site: 'https://gandolh.ro',
  integrations: [
    starlight({
      title: 'Public Resource Map',
      description:
        'A place-centric map of public resources and what is on at them, for Romanian cities — a proof of concept, and honest about being one.',
      tagline: 'The unit is a place, not an event.',
      customCss: ['./src/styles/theme.css'],
      // Both themes ship, as in the app: ui/DESIGN.md's reason is the use
      // scene — daylight outdoors and a laptop indoors — and both palettes are
      // designed rather than inverted.
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/gandolh/public-resource-map' },
      ],
      sidebar: [
        {
          label: 'Start here',
          items: [
            { label: 'What PRM is', link: '/' },
            { label: 'Overview', link: '/wiki/overview/' },
            { label: 'Architecture', link: '/wiki/architecture/' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'HTTP API', link: '/api/' },
            { label: 'Data model', link: '/data/' },
            { label: 'Ingestion', link: '/ingestion/' },
            { label: 'Shared schemas (TypeDoc) ↗', link: '/reference/', attrs: { target: '_blank' } },
          ],
        },
        {
          label: 'Design',
          items: [
            { label: 'The design system', link: '/wiki/design/' },
            { label: 'Screens', link: '/wiki/stitch-screens/' },
          ],
        },
        {
          label: 'Decisions and state',
          items: [
            { label: 'Decisions', link: '/wiki/decisions/' },
            { label: 'Glossary', link: '/wiki/glossary/' },
            { label: 'Open questions', link: '/wiki/open-questions/' },
            { label: 'Status', link: '/wiki/status/' },
            { label: 'Change log', link: '/wiki/log/' },
          ],
        },
      ],
    }),
  ],
})
