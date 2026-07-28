import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

// Sub-path base for a Caddy sub-path deploy (e.g. /prm/). Left at "/" for local
// dev; the vps-deploy build sets PRM_BASE. Must match react-router.config.ts's
// basename. Pair with VITE_API_URL (app/lib/api.ts) so API calls hit the
// proxied API prefix.
const base = process.env.PRM_BASE ?? "/";

export default defineConfig({
  base,
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./app"),
    },
  },
});
