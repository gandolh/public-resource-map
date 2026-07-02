# Routing — how work routes in this project
<!-- Read by the orchestrate skill. Tune freely; keep it short. -->

**Implement skill:** plan-split-dispatch
**Review skill:** a general-purpose agent over the diff (no repo review cmd yet; Vitest harness lands in brief 11, Playwright in brief 17)
**PR skill:** propose git commands (never commit/push without the user's say-so)
**Issue tracker:** none — briefs in `corpus/briefs/` are the work items
**Code host:** GitHub (`gh`) — origin: gandolh/public-resource-map

## Stack (for context routing)
- npm workspaces: `shared` (Zod types — build first), `backend` (Fastify 5 + Drizzle ORM + better-sqlite3), `ui` (React + Vite, Base UI, CivicMap tokens)
- TypeScript throughout; `.js` import specifiers convention
- Build: `npm run build` (shared→backend→ui). Typecheck: `npm run typecheck`. Dev: `npm run dev` (backend :3001 + ui :5173)
- Tests: none yet — brief 11 adds Vitest, brief 17 adds Playwright
- DB: `npm run db:migrate -w backend`, `npm run db:seed -w backend`

## Intent routing
| Signal | Intent | Route to |
|--------|--------|----------|
| New idea/task to capture | capture | corpus-flow: add todo |
| "implement the briefs" / whole backlog | build (waves) | plan-split-dispatch master-orchestrator (dependency waves + verify gate) |
| Ready to build, ≥3 chunks | build | brief → plan-split-dispatch |
| Ready to build, 1–2 files | build (small) | brief → implement inline |
| Diff/branch to review | review | general-purpose agent over the diff |
| Branch ahead, ship intent | PR open | propose git commands |
| "what does the wiki say about X" | query | corpus-flow: query wiki |

## Build order (from status.md + decisions.md)
**Build first:** 07 (schema consolidation) then 11 (Vitest harness). These unblock everything else.
Remaining briefs 02–06, 08–10, 12–17 sequence by dependency — plan-split-dispatch resolves the wave graph.

## READ / SKIP / SKILLS
| Task type | READ | SKIP | SKILLS |
|-----------|------|------|--------|
| schema/data (07,08) | corpus/wiki/decisions.md, corpus/wiki/architecture.md, the brief, shared/, backend/ | ui/ styling | — |
| backend/ingestion (03,04,05) | decisions.md, architecture.md, the brief, backend/, shared/ | ui/ | — |
| auth (02) | decisions.md, the brief, backend/, ui/ | — | — |
| UI (06,13,14,15,16) | decisions.md, design.md, stitch-screens.md, the brief, ui/ | backend internals | impeccable / design-taste-frontend for visual work |
| test harness (10,11,17) | the brief, status.md (dev commands), shared/backend/ui test setup | — | — |
| optimization (12) | decisions.md, architecture.md, the brief | — | — |
