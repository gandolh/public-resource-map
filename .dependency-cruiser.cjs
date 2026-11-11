// The house dependency-cruiser preset, from the vendored house-style copy: no cycles, no unresolvable
// imports, a feature used through its index only, no Fastify in lib/. The UI's tsconfig names the `~/` and
// `@/` aliases; the other workspaces use none.
module.exports = {
  extends: "./vendor/house-style/.dependency-cruiser.cjs",
  options: { tsConfig: { fileName: "ui/tsconfig.json" } },
};
