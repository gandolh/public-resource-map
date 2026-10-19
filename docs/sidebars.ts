import type { SidebarsConfig } from '@docusaurus/plugin-content-docs'

// Doc items are checked at build time: a sidebar entry for a page that does not
// exist fails the build instead of rendering a dead link. Doc ids are paths
// under docs/ without the extension (docs/wiki/status.md → 'wiki/status').
// The wiki pages are synced from corpus/ by scripts/sync-corpus.mjs.
const sidebars: SidebarsConfig = {
  docs: [
    {
      type: 'category',
      label: 'Start here',
      collapsible: false,
      items: [
        { type: 'doc', id: 'index', label: 'What PRM is' },
        { type: 'doc', id: 'wiki/overview', label: 'Overview' },
        { type: 'doc', id: 'wiki/architecture', label: 'Architecture' },
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      collapsible: false,
      items: [
        { type: 'doc', id: 'api', label: 'HTTP API' },
        { type: 'doc', id: 'data', label: 'Data model' },
        { type: 'doc', id: 'ingestion', label: 'Ingestion' },
        // TypeDoc's HTML in static/, not a Docusaurus route: `pathname://`
        // makes it a plain link (new tab, baseUrl still applied) instead of a
        // router navigation that would 404.
        { type: 'link', label: 'Shared schemas (TypeDoc) ↗', href: 'pathname:///reference/' },
      ],
    },
    {
      type: 'category',
      label: 'Design',
      collapsible: false,
      items: [
        { type: 'doc', id: 'wiki/design', label: 'The design system' },
        { type: 'doc', id: 'wiki/stitch-screens', label: 'Screens (historical)' },
      ],
    },
    {
      type: 'category',
      label: 'Decisions and state',
      collapsible: false,
      items: [
        { type: 'doc', id: 'wiki/decisions', label: 'Decisions' },
        { type: 'doc', id: 'wiki/decisions-identity', label: 'Decisions: identity' },
        { type: 'doc', id: 'wiki/decisions-ui', label: 'Decisions: interface' },
        { type: 'doc', id: 'wiki/decisions-engineering', label: 'Decisions: stack' },
        { type: 'doc', id: 'wiki/glossary', label: 'Glossary' },
        { type: 'doc', id: 'wiki/open-questions', label: 'Open questions' },
        { type: 'doc', id: 'wiki/status', label: 'Status' },
        { type: 'doc', id: 'wiki/log', label: 'Change log' },
      ],
    },
  ],
}

export default sidebars
