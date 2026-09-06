# public-resource-map — the Fastify/sqlite API behind the React Router SPA.
#
# Build context is the REPO ROOT (one root lockfile covers shared/backend/ui).
#
# Two stages matter here. `builder` compiles shared then backend — in that
# order, because backend's tsconfig has a project reference to ../shared — and
# keeps its devDependencies, so it can also run the `tsx`-based migrator. `prod`
# takes only the emitted JavaScript and production dependencies, so no
# TypeScript compiler and no tsx reach the running service.
#
# The stale-tsbuildinfo problem that used to need an explicit clean on the box
# cannot happen here: every image build starts from a fresh layer, so `shared`
# being a composite project has no prior build state to be confused by.
#
# Runs as root, which under the VPS's ROOTLESS daemon is the unprivileged
# account owning it — required because /data is a bind mount.

FROM node:24-alpine AS deps
# better-sqlite3 ships a linuxmusl-x64 prebuild; the toolchain is a fallback for
# a version bump that ever drops it.
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/
COPY ui/package.json ./ui/
RUN npm ci

FROM deps AS builder
COPY shared ./shared
COPY backend ./backend
# shared first: backend's tsconfig references it as a project.
RUN npm run build -w @public-resource-map/shared \
 && npm run build -w @public-resource-map/backend

FROM node:24-alpine AS proddeps
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/
COPY ui/package.json ./ui/
RUN npm ci --omit=dev
# Keep every linux prebuild; delete only what this image can never be. A
# whitelist here is a trap: these are FILES (`prebuilds/linuxmusl-x64.node`),
# so a `case` on bare directory names matches nothing and removes the lot.
RUN cd node_modules \
 && find . -name '*.o' -delete \
 && find . -type d -name obj.target -prune -exec rm -rf {} + \
 && rm -rf better-sqlite3/deps better-sqlite3/src \
 && find . -type d -name prebuilds -exec sh -c \
      'rm -f "$1"/darwin-*.node "$1"/win32-*.node "$1"/android-*.node' _ {} \;

FROM node:24-alpine AS prod
LABEL org.opencontainers.image.title="public-resource-map API"
WORKDIR /app
COPY --from=proddeps /app/node_modules ./node_modules
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/backend/dist ./backend/dist
COPY package.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8790 \
    DATABASE_PATH=/data/app.db
VOLUME /data
EXPOSE 8790
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- "http://127.0.0.1:${PORT}/health" || exit 1
CMD ["node", "backend/dist/index.js"]
