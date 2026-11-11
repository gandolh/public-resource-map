import preset from "./vendor/house-style/knip.json" with { type: "json" };

// knip has no `extends`, so this spreads the house preset. The workspaces' own entries are the ones knip
// finds from their package.json; the root adds the scripts, and the docs site stays out.
export default {
  ...preset,
  ignore: [...preset.ignore, "docs/**"],
  workspaces: {
    ".": { entry: ["scripts/*.{js,mjs,ts}", "e2e/*.spec.ts"] },
    ui: { entry: ["app/routes/**/*.tsx"] },
  },
};
