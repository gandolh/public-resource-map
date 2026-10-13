import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type ProxyOptions } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

// Sub-path base for a Caddy sub-path deploy (e.g. /prm/). The vps-deploy build
// sets PRM_BASE; `npm run dev` gets it from the repo-root .env (/prm/, see
// .env.example), so local dev is served where the deploy is. Must match
// react-router.config.ts's basename. Pair with VITE_API_URL (app/lib/api.ts) so
// API calls hit the proxied API prefix.
const base = process.env.PRM_BASE ?? "/";

/**
 * Local dev on one origin, the way Caddy serves the deploy: `/prm-api` is the
 * backend with the prefix stripped. prm's session cookie is scoped to that
 * prefix, and Ward's callback (`/prm-api/auth/ward/callback`) rides the same
 * rule. Ward itself is reached on its own origin (the browser goes there for
 * "Sign in with Ward"; the backend through WARD_OIDC_ISSUER), so there is no
 * Ward proxy here.
 */
function devProxy(): Record<string, ProxyOptions> {
  return {
    "/prm-api": {
      target: `http://localhost:${process.env.PORT ?? 3001}`,
      rewrite: (url) => url.replace(/^\/prm-api/, ""),
    },
  };
}

export default defineConfig({
  base,
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./app"),
    },
  },
  server: { proxy: devProxy() },
});
