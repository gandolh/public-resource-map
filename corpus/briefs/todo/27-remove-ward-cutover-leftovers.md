# Brief 27 — Remove what the Ward cutover left behind

> Written 2026-09-27 from the [improvements audit](../../todos/2026-09-27-improvements-audit.md) (#10). **After 22** (shares `backend/package.json`). **Before 28** (both rewrite `package-lock.json`, so run them in sequence).

## Context

The 2026-09-06 cutover ([log](../../log.md), [decisions.md → Identity is Ward's](../../wiki/decisions.md)) deleted prm's own auth, but some of its parts survived with no importer. Each item below was checked with a repo-wide grep on 2026-09-27; re-run the grep before deleting.

| Leftover | Evidence | Cost of keeping it |
|---|---|---|
| `argon2` 0.44.0 in `backend/package.json` | no import in `backend/src` | a **native addon** compiled into and shipped in the production image (`infrastructure/Dockerfile` installs a toolchain for native builds); install time, image size, attack surface |
| `@fastify/cookie` 11.0.2 in `backend/package.json` | no import; the Ward client parses the header itself (`ward.client.ts:86-103`) | a dead runtime dependency |
| `ui/app/components/shell/AuthCard.tsx` | imported by nothing (the login/register screens it framed were deleted) | dead UI plus its i18n keys |
| the `auth.loginTitle` … `auth.checkEmailBody` keys in `ui/app/lib/i18n.tsx` (≈ lines 164-181 in RO, and their EN twins) | used only by the deleted screens / `AuthCard` | dead translation strings that mislead the next reader about which flows exist |
| `shared/src/types/auth.ts` | its body is only `export {}`; still re-exported by `shared/src/index.ts` | an empty module in the public barrel |

**Keep** `backend/src/lib/mailer.ts`. It is dead today, but [brief 05](05-favorites-and-notifications.md) reuses it for notification email.

## Files you OWN
- `backend/package.json`, `package-lock.json`
- `ui/app/components/shell/AuthCard.tsx` (delete)
- `ui/app/lib/i18n.tsx`: remove the dead `auth.*` keys only (`auth.unavailable` is live, used by `Navbar.tsx:83`; keep it and any other key a grep still finds)
- `shared/src/types/auth.ts` (delete), `shared/src/index.ts` (drop its re-export)

## Files you must NOT touch
- `backend/src/lib/mailer.ts`
- `ui/app/lib/authApi.ts`, `ui/app/stores/authStore.ts`: live; the Navbar uses both.
- `infrastructure/Dockerfile`: its toolchain stays for `better-sqlite3`'s fallback build.

## What to do
1. For each row, re-grep for importers (excluding `node_modules`, `dist`, `build`); delete only if there are still none.
2. `npm uninstall -w @public-resource-map/backend argon2 @fastify/cookie`, and check the lockfile diff removes them and nothing else unexpected.
3. For each `auth.*` key, grep `t("<key>")` across `ui/app` before removing it from both language tables.
4. Rebuild `shared` (`npm run build -w shared`) so `dist/` has no stale `types/auth.*`.

## Acceptance
- `npm ls argon2 @fastify/cookie` → empty.
- `npm run typecheck`, `npm test`, `npm run build` green.
- The API image still builds: `docker compose -f infrastructure/docker-compose.yml build prm-api`, if Docker is available. Otherwise say it was not run.
- The UI in the browser: the Navbar sign-in/account menu behaves as before, and no missing-key text appears.
