// The house dependency-cruiser preset, from the vendored house-style copy: no cycles, no unresolvable
// imports, a feature used through its index only, no Fastify in lib/. The UI's tsconfig names the `~/` and
// `@/` aliases; the other workspaces use none.
module.exports = {
  extends: "./vendor/house-style/.dependency-cruiser.cjs",
  forbidden: [
    {
      // React Router's typegen writes the `+types` modules under ui/.react-router, which the cruiser's resolver
      // doesn't see through the tsconfig's rootDirs.
      name: "not-to-unresolvable",
      to: { couldNotResolve: true, pathNot: ["^virtual:", "(^|/)\\+types/"] },
    },
  ],
  options: { tsConfig: { fileName: "ui/tsconfig.json" } },
};
