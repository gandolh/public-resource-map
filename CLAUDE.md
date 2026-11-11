# public-resource-map

A map of public places and what is on at them in Timișoara and București: a Fastify and SQLite API
(`backend/`), a React Router single-page app (`ui/`) and the zod schemas both share (`shared/`). Read
[corpus/index.md](corpus/index.md) first.

## Commands

- `npm run dev`: the API on 3001 and the UI on Vite's 5173.
- `npm run check`: typecheck, lint, format check, conventions, unit tests. Run it before every hand-back.
- `npm run check:fast`: the typecheck, then ESLint on the changed files. The Stop hook runs it.
- `npx vitest run <file>`: one test file. `npm run test:e2e`: the Playwright suite (needs a browser).
- `npm run format`: Prettier writes every file it covers (Markdown and CSS stay out).
- `npm run db:migrate`, `db:seed`, `db:seed-users`, `db:set-role`, each with `-w backend`.

## Places that mislead

- `shared` builds first (`npm run build`): the backend's typecheck reads `shared/dist`.
- The typecheck is four processes (shared, backend, ui after `react-router typegen`, then `e2e/`).
- `.env` sits at the repo root, and both dev servers read it with `--env-file-if-exists`.
- The UI source is `ui/app/`, not `ui/src/`. The app lives under `/prm/` in production (`PRM_BASE`).
- `backend/vendor/` and `ui/vendor/` (Ward's library) and `vendor/house-style/` are generated copies. Never
  edit them; `npm run house-style:sync` refreshes the last.
- `docs/` is a separate Docusaurus package, outside every check here.
- `noUncheckedIndexedAccess` is off for now, and so is `no-unnecessary-type-assertion`; they come back together.

## Hard rules

- **No secrets.** Never write a password, token or key into the repo or the corpus, and never read or print `.env`.
- **No CI.** Don't add GitHub Actions, runners or other GitHub-specific automation.
- **No pushes.** Commit locally on `main`. The owner pushes.
- **Deploys are owner steps.** Write the exact commands in the brief's hand-back.
- **No brief numbers in code comments.** Say what the code does and why; history belongs in `corpus/log.md`.
- **Dates are absolute** (`2026-11-11`) in code comments and the corpus.

## brief-board

Brief progress goes on brief-board. Run `brief-board guide` before you start or resume a brief, and follow it.
