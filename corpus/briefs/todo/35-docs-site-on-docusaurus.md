# Brief 35 — Move the docs site from Starlight to Docusaurus

## Context

On 2026-10-18 the owner decided to move every project's docs site from Astro
Starlight to Docusaurus. `docs/` (`@prm/docs-site`, served at `/prm/docs/`) is
one of them.

The recipe is written and verified. The `corpus-docs-site` skill
(personal-skills v0.31.0, source in
`~/projects/my-personal-skills/skills/corpus-docs-site/`) now scaffolds
Docusaurus 3.10, and `references/migrating-from-starlight.md` beside it holds
the file, config and content maps plus ten gotchas, each hit during a real
port. **Read that guide first.** The files this brief tells you to copy are in
the same folder. If the installed plugin is older than v0.31.0, read them from
the source path.

What the site has today (2026-10-18):
- base `/prm/docs/` (`DOCS_BASE ??`), 17 sidebar links, with TypeDoc
  ("Shared schemas") opening in a new tab;
- **both themes**: a light palette and a designed dark one in
  `src/styles/theme.css` (262 lines, 50 `--sl-*` tokens, Archivo via
  `@fontsource`), with Starlight's toggle left in;
- four authored pages, `index.mdx` (a `Diagram`, a raw `<dl>`),
  `ingestion.mdx` (a `Diagram`), `data.mdx` and `api.mdx`, with 12 `:::note`,
  one `:::caution` and one `:::danger`;
- `scripts/sync-corpus.mjs` with a hand-kept list of 12 pages, and
  `scripts/build-diagrams.mjs` (two archify diagrams);
- TypeDoc (`../shared/src/index.ts` → `public/reference`).

**Built through Docusaurus on 2026-10-18.** All 11 corpus pages built through
the new sync in `markdown.format: 'detect'` mode, with no broken anchors. In MDX
mode the corpus does not compile. One finding:
`corpus/wiki/decisions-identity.md` has three links into
`../../../wzd_auth/corpus/wiki/…` (the first at line 32). Docusaurus fails the
build on them. Starlight's sync had turned them into 404ing GitHub URLs under
this repo's `corpus/`.

## What to do

1. **Baseline.** `npm run docs -w @prm/docs-site`, then save
   `(cd docs/dist && find . -name index.html | sort) > /tmp/prm-routes-before.txt`.
2. **Config.** Write `docs/docusaurus.config.ts` from the skill's reference.
   Set baseUrl `process.env.DOCS_BASE ?? '/prm/docs/'`, `trailingSlash: true`,
   `routeBasePath: '/'`, `markdown.format: 'detect'`, local search, and the
   GitHub navbar item. **colorMode = both**: `{ defaultMode: 'light',
   disableSwitch: false, respectPrefersColorScheme: true }`. Port the 17-link
   sidebar to `docs/sidebars.ts`. "Shared schemas" becomes
   `{ type: 'link', href: 'pathname:///reference/' }`. Content lives in
   `docs/docs/`. `docs/README.md`, `docs/getting-started.md` and
   `docs/images/` stay where they are, and the build ignores them.
3. **package.json** per the guide: no `"type": "module"`, keep the
   `browserslist`, and add `start`/`docs`/`typecheck`. Keep `typedoc` and
   `@fontsource-variable/archivo` at their exact versions. Drop `astro`,
   `@astrojs/starlight` and `sharp`.
4. **Content.** Move the four `.mdx` pages to `docs/docs/`. `index.mdx` gets
   `slug: /`. Replace the `tableOfContents` key. Use the skill's
   `Diagram.tsx`. `git mv public/diagrams static/diagrams`, and point
   `build-diagrams.mjs` at it.
5. **Sync.** Use the skill's `sync-corpus.mjs`, with `GITHUB_REPO` set to this
   repo's GitHub URL and
   `OTHER_REPOS = { wzd_auth: 'https://github.com/gandolh/ward-auth' }`.
   Discovery renders every wiki page. Check the set against the old list and
   the sidebar. TypeDoc's `"out"` becomes `"static/reference"`.
6. **Theme.** Port `theme.css` to `src/css/custom.css` with one block for
   light (`:root, :root[data-theme='light']`) and one for
   `:root[data-theme='dark']`, each mapping the design tokens onto `--ifm-*`.
   The selector map is in the skill's `references/custom.css` header. Keep the
   "designed, not inverted" comments.
7. **Wiring.**
   - `docs/.gitignore`: `.astro/` → `.docusaurus/`, `src/content/docs/wiki/` →
     `docs/wiki/`, `public/reference/` → `static/reference/`.
   - Update the framework mentions in `README.md` (line 74),
     `docs/README.md` (lines 3 and 14: Starlight, `astro.config.mjs`,
     `src/content.config.ts`), `docs/getting-started.md` (line 91, "builds the
     Starlight site") and `corpus/wiki/architecture.md` (line 10, "the
     Starlight site").

## Acceptance

- `npm run docs -w @prm/docs-site` exits 0 with `onBrokenLinks: 'throw'`.
- Route parity: the new route list equals `/tmp/prm-routes-before.txt` plus
  `./search/index.html`.
- `grep -c '/prm/docs/assets/' docs/dist/index.html` is non-zero, and
  `grep -rl '_astro' docs/dist` finds nothing.
- `decisions-identity`'s Ward links point at `github.com/gandolh/ward-auth`.
- `npm run typecheck -w @prm/docs-site` and the repo's test/typecheck scripts
  pass.
- Browser check, with `docs/dist` served at `/prm/docs/` by a plain static
  server (not `docusaurus serve`):
  - the landing page, `/ingestion/` and one synced wiki page render;
  - both diagrams and `/reference/` load;
  - the toggle switches light and dark, and both match the old site;
  - Archivo loads with no 404s;
  - search returns results.
  Screenshot light and dark.
- `bash corpus/lint.sh` passes.

## Out of scope

Deploying. The owner deploys after vps-deploy brief 11 flips the `prm` docs
stack.
