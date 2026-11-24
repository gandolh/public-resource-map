# Brief 10: The image's build stage installs only shared and backend, on a pinned base

**Depends on:** brief 09 (same Dockerfile, on main).
**Builder:** Sonnet.
**Before you start:** run `brief-board guide` (the repo's `CLAUDE.md` says so).

Filed 2026-11-24 from the estate's infra review. Every app image is built on the box by vps-deploy's `server`
phase, and on 2026-11-23 the box's build cache (9.3 GB) took its disk to 90%. The cache was pruned to zero on
2026-11-24, so the next rollout builds every image cold. The same tidy is filed in ten repos; sports-app's
Dockerfile already scopes its build install.

## Context

Two things in `infrastructure/Dockerfile`, both build-side or base-side. The image that runs doesn't change.

- **The `deps` stage installs every workspace** (`RUN npm ci`, line 28) to build two: `builder` runs
  `npm run build` for `@public-resource-map/shared` and `@public-resource-map/backend` (lines 36-37). The UI's
  tree (React Router, Vite, MapLibre and the rest) is installed for nothing. Measured on the laptop on
  2026-11-24: the full install is 745 MB of `node_modules`; the closure of the two workspaces plus the root's dev
  dependencies is about 306 MB, so about 439 MB less per cold build. Brief 09 already scoped `proddeps` the same
  way.
- **The base floats.** `FROM node:24-alpine` (lines 19, 39, 59) follows whatever the tag is on the day of the
  build: on the laptop it is Node 24.21.0 on alpine 3.24.2, while imbatranimOS pins `node:24.22.1-alpine`. On the
  box that is two separate 171 MB bases and two copies of the `apk add python3 make g++` layer, which is otherwise
  one cached layer shared by every alpine Dockerfile. vps-deploy's weekly housekeeping removes a base tag no image
  uses after two weeks; the next deploy pulls the tag's current image and every cache entry keyed on the old one
  is dead.

## Decisions

- `deps` runs
  `npm ci -w @public-resource-map/shared -w @public-resource-map/backend --include-workspace-root`. Every manifest
  is still copied: `npm ci` checks the lockfile against all of them.
- Every stage's base is `node:24.22.1-alpine`. The estate moves to a new patch in one sweep, not per repo.

## Files you OWN

- `infrastructure/Dockerfile`
- The image paragraph in `corpus/wiki/decisions-engineering.md`, if it names the install or the base
- The closeout: the outcome note, `corpus/log.md`, `corpus/wiki/status.md`

## Files you must NOT touch

- Any `package.json` or `package-lock.json`; `infrastructure/docker-compose.yml`.
- vps-deploy: read only.

## What to do

1. **Check the scoped install without Docker.** Export the tree to a scratch folder outside the repo
   (`git archive HEAD | tar -x -C <scratch>`). There, run the full `npm ci` and `du -sm node_modules`; delete
   `node_modules`, run the scoped command, `du -sm` again, then the two builds in the order of lines 36-37. They
   must pass. If one fails on a missing package, find which workspace or root package brings it, add it, and say
   so in the outcome.
2. Edit the Dockerfile: the scoped `deps` install with a comment saying why, and the three `FROM` lines.
3. On the laptop, build today's image and the new one (`docker compose -f infrastructure/docker-compose.yml build
   prm-api`) and save `docker history` of each and the `deps` stage's size (`docker build --target deps`).
4. Against a scratch data folder: `compose run --rm prm-migrate` creates the schema, `prm-api` starts healthy on
   it, and `/health` answers.

If your session can't build Docker images, do steps 1 and 2, run the checks, and hand back with steps 3 and 4 for
the controller.

## Acceptance

- [ ] Step 1's two `du` readings and the build result are in the outcome.
- [ ] The image builds on the laptop; `docker history` before and after, from one machine, in the outcome. The
      `deps` stage is smaller; the final image is within a few MB of today's.
- [ ] Step 4 passes.
- [ ] `npm run check` exits 0; `bash corpus/lint.sh` passes.
- [ ] End move `ready_for_deploy`.

## Owner steps

- `node cli.ts public-resource-map server` from vps-deploy. The deploy builds the image on the box.

## Outcome

Built 2026-11-24 by the controller (58a4174). Ready for deploy: `node cli.ts public-resource-map server`.

- **Step 1**, in a `git archive` export: the full `npm ci` leaves 745 MB of `node_modules`; the scoped install
  leaves 307 MB (438 MB less), and the shared then backend builds pass. Nothing else was needed.
- **Step 2**: `deps` runs the scoped install with a comment saying why; the three `FROM` lines are
  `node:24.22.1-alpine`.
- **Step 3**, both built on the laptop the same hour: the `deps` stage image 922 MB before, 837 MB after; the
  final image 229 MB before, 230 MB after. `docker history` differs only in three layer sizes by about 10 kB to
  1 MB (the pinned Node patch). The `deps` image shrinks less than `node_modules` because its base, the
  toolchain layer and npm's cache sit under both.
- **Step 4**, on a scratch data folder: the migration (the image's `backend/dist/db/migrate.js`, as
  `prm-migrate` runs it) printed "Migrations applied successfully" on an empty folder; then the API, with
  `PUBLIC_ORIGIN` set (it refuses to start without one), turned healthy and `/health` answered
  `{"status":"ok"}`; Node is v24.22.1. Test images and the container were removed.
- `npm run check` exits 0; `bash corpus/lint.sh` passes.
