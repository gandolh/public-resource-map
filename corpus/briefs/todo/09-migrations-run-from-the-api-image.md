# Brief 09: Migrations run from the API image

## Context

On 2026-11-24 the box's disk was 90% full after the 2026-11-23 rollout, and
Docker held 26 of its 38 GB. The box gets no extra storage (vps-deploy's
decisions, 2026-11-06), so image size is what there is to cut.

Every deploy of this stack builds two images. `prm-api:1.0` is the server.
`prm-migrate:1.0` is the compose service vps-deploy runs once per deploy
(`compose run --rm prm-migrate`) to apply the migrations. It builds the
Dockerfile's `builder` stage because `npm run db:migrate` is
`tsx src/db/migrate.ts`, and tsx is a dev dependency. That stage carries the
full install, dev dependencies included: 1.39 GB on the box on 2026-11-24,
1.15 GB of it shared with nothing, rebuilt on every deploy and kept until the
weekly clean-up drops images unused for two weeks.

The migration doesn't need tsx. `backend/src/db/migrate.ts` already compiles
with the rest of the backend (`tsc`, `include: ["src"]`) to
`backend/dist/db/migrate.js`, which reads the SQL files from `backend/drizzle/`
relative to its own folder. `drizzle-orm` is a production dependency. The
production image lacks only the `drizzle/` folder.

`proddeps` also runs `npm ci --omit=dev` at the root, so `prm-api` carries the
UI workspace's runtime packages. Caddy serves the UI as static files; the API
never loads them.

## Decisions

- `prm-migrate` builds the `prod` target and runs
  `node backend/dist/db/migrate.js`. It is the same stage as `prm-api`, so both
  tags name one image and the migration costs no extra disk.
- The service keeps its name, `prm-migrate`, and its `tools` profile, so
  vps-deploy's stack runs it unchanged. Once this ships, the comment in
  vps-deploy's public-resource-map stack that says the migration runs against
  the builder image is out of date; the controller fixes it there.
- `npm run db:migrate` keeps tsx for local development.
- The production install is scoped to `@public-resource-map/shared` and
  `@public-resource-map/backend`.

## Files you OWN

- `infrastructure/Dockerfile`
- `infrastructure/docker-compose.yml`
- `.dockerignore`, if `backend/drizzle` needs letting in
- The wiki page that describes the deploy or the image

## Files you must NOT touch

- `backend/src/db/migrate.ts`'s behaviour and the files in `backend/drizzle/`.
- Any `package.json` or `package-lock.json`.

## What to do

1. Record today's numbers on one machine: build `prm-api` and `prm-migrate`,
   save `docker history` of each and their image IDs.
2. In the `prod` stage, add `COPY backend/drizzle ./backend/drizzle`. Check
   that `.dockerignore` lets the whole folder in, `backend/drizzle/meta/_journal.json`
   included (it excludes `*.md`, `**/dist` and others today).
3. In the compose file, point `prm-migrate` at `target: prod` with the
   entrypoint `["node", "backend/dist/db/migrate.js"]`, and rewrite its
   comment to say why it no longer needs the builder stage.
4. Scope `proddeps`:
   `npm ci --omit=dev --workspace @public-resource-map/shared --workspace @public-resource-map/backend`.
   Copy every `node_modules` folder the scoped install leaves, not only the
   root one, and keep the prebuild trimming.
5. Build both on the same machine. Both tags have one image ID, or
   `prm-migrate`'s unique size is close to zero.
6. Against a scratch data folder: `compose run --rm prm-migrate` creates the
   schema from nothing, a second run changes nothing, and `prm-api` starts
   healthy on that database. Then run it once on a copy of the local
   development database, never the box's, and confirm it is a no-op there too.

If your session can't build Docker images, make the changes, run the repo's
checks, and hand back with steps 1, 5 and 6 for the controller.

## Acceptance

- `prm-migrate` and `prm-api` share one image, and the migration applies from
  empty and is a no-op on an up-to-date database.
- `prm-api`'s node_modules has no package that only `ui/package.json`
  declares.
- `npm run check` passes.
- The outcome note has both `docker history` readings, taken on one machine.
- The deploy is the owner's step: `node cli.ts public-resource-map deploy`
  from vps-deploy.
