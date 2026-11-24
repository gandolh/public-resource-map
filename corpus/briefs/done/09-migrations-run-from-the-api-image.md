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

## Outcome (2026-11-24)

Built in the commit "build: migrations run from the API image; the production install skips the UI's packages". Changes: `infrastructure/Dockerfile` (scoped `proddeps` install, both `node_modules` folders copied, `COPY backend/drizzle`) and `infrastructure/docker-compose.yml` (`prm-migrate` on `target: prod`, entrypoint `node backend/dist/db/migrate.js`, comment rewritten). `.dockerignore` needed nothing: it excludes no `.sql` or `.json` file, and `backend/drizzle/meta/_journal.json` is in the image.

**`docker history`, one machine (Docker Desktop, 2026-11-24, local tags `prm09-*`)**

Before:
- `prm-api` (prod stage): image `79a84eecbe64`, 293 MB; `node_modules` layer 122 MB.
- `prm-migrate` (builder stage): image `480b34e4b539`, 926 MB; `npm ci` layer 445 MB on top of a 305 MB toolchain layer, plus the node base.

After:
- `prm-api` and `prm-migrate` (both the prod stage): one image, `ac411566504e`, 229 MB; `node_modules` layer 56.7 MB, `backend/node_modules` 47 kB, `backend/drizzle` 177 kB.
- The migrate image's unique size is zero. The two tags are one ID, so a deploy builds one image instead of two.

The scoped install leaves two `node_modules` folders, the root one and `backend/node_modules`; `shared` has none. None of the 14 packages that only `ui/package.json` declares is in the image.

**Checks against a throwaway volume** (the scratch volume and containers were removed afterwards): the migrator applied all 5 migrations from an empty database; a second run reported success and left every table's contents unchanged (same hash); `prm-api` then started healthy on that database and answered `/health`. These ran with `docker run` and an entrypoint override equal to the compose service's, because compose's `env_file` would need the real `.env`. The copy of the local development database was skipped: `backend/data/` holds only `.gitkeep` on this machine.

**Deploy phase.** The brief's `deploy` command ships only the static client. This change is the Dockerfile and compose file, so the owner step is `node cli.ts public-resource-map server` from vps-deploy (or `all` with a client change).
