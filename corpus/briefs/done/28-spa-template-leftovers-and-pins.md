# Brief 28 — SPA-template leftovers out, dependency pins back to policy

> Written 2026-09-27 from the [improvements audit](../../todos/2026-09-27-improvements-audit.md) (#11). **After 27** (both rewrite `package-lock.json`).

## Context

The UI started from the `create-react-router` SSR template and runs in SPA mode (`ssr: false`, `ui/react-router.config.ts`). The deploy serves `build/client` statically through Caddy ([decisions.md → Deployment](../../wiki/decisions.md)). Three template artefacts remain, and two manifests break the locked "exact-pinned, no `^`" policy ([decisions.md → Stack](../../wiki/decisions.md)).

| Item | Evidence (2026-09-27) | Why it matters |
|---|---|---|
| `@react-router/serve` in `ui/package.json` | only used by the `start` script; an *optional* peer of `@react-router/dev` (`node_modules/@react-router/dev/package.json`) | it pulls in `express`, whose `cookie@0.7.2` hoists to the repo root (`npm ls cookie`). That hoisting is the whole reason for the `//cookie` workaround in `docs/package.json` |
| `ui/Dockerfile` | node:20 template; copies `package-lock.json`, which does not exist in `ui/`; referenced by nothing | cannot build as written, contradicts the Caddy-static deploy, and misleads anyone looking for how the UI ships |
| `ui/components.json` | shadcn CLI config; shadcn was replaced by `@base-ui/react` ([decisions.md → Code conventions](../../wiki/decisions.md)); referenced by nothing | running the shadcn CLI would write components that fight the design system |
| `"jose": "^6.2.10"` in `backend/package.json` | installed 6.2.10 | the JWT library under prm's Ward client, the one dependency where an unreviewed bump matters most |
| every `docs/package.json` dependency is `^`/ranged | installed: `@astrojs/starlight` 0.41.11, `@fontsource-variable/archivo` 5.3.0, `astro` 7.3.1, `cookie` 2.0.1, `sharp` 0.35.4, `typedoc` 0.28.20 | policy breach; the declared ranges already lag what is installed |

`@react-router/node` and `isbot` look unused but are **not** removable: `@react-router/dev` depends on both itself. Leave them.

## Files you OWN
- `ui/package.json`, `backend/package.json`, `docs/package.json`, `package-lock.json`
- `ui/Dockerfile` (delete), `ui/components.json` (delete)
- `ui/README.md`, if it documents the template's `start`/Docker flow

## Files you must NOT touch
- `infrastructure/**`: the API image is correct.
- `ui/react-router.config.ts`, `ui/vite.config.ts`.

## What to do
1. Remove `@react-router/serve` from `ui`. Replace the `start` script with a local preview of the static build (e.g. `vite preview`, if it serves the SPA under `PRM_BASE` correctly), or drop the script. Say which in the log.
2. Delete `ui/Dockerfile` and `ui/components.json`, after re-grepping that nothing references them.
3. Pin `jose` to `6.2.10`, and each docs dependency to its **installed** version from the table (re-check with `npm ls -w @prm/docs-site --depth=0`).
4. **The docs `cookie` workaround:** after the reinstall, check `npm ls cookie` and try `npm run docs -w @prm/docs-site` *without* the `cookie` devDependency. Remove it and the `//cookie` note **only if** the build passes. The root may now hoist `cookie@1.x` from Fastify's `light-my-request`, which lacks `parseCookie` too. If the build still fails, keep the dependency and rewrite the note to name the new source.

## Acceptance
- `grep -rn '"\^\|"~' */package.json package.json` → no hits.
- `npm ls @react-router/serve express` → empty.
- `npm run build`, `npm run typecheck`, `npm test` green; `npm run docs -w @prm/docs-site` green.
- `npm run dev` still serves the UI on :5173.

## Outcome (2026-10-03)

Done. `start` is now a `vite preview` of `build/client`, which serves under `PRM_BASE` with SPA fallback and the inherited `/prm-api` proxy. The template's Dockerfile and `components.json` are deleted and its README rewritten. `jose` and the docs deps are pinned to their installed versions. The docs `cookie` workaround is removed: nothing hoists `cookie` to the root any more, and `npm run docs` builds clean without it. All acceptance commands are green.
