import type { Config } from "@react-router/dev/config";

// Sub-path base for a Caddy sub-path deploy (e.g. /prm/). Left at "/" for local
// dev; the vps-deploy build sets PRM_BASE. Must match the Vite `base` (see
// vite.config.ts) — React Router checks they agree.
const basename = process.env.PRM_BASE ?? "/";

export default {
  // Config options...
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: false,
  basename,
} satisfies Config;
