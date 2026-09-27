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
 * backend with the prefix stripped, and `/ward` + `/ward-api` are the Ward the
 * backend trusts (WARD_PUBLIC_ORIGIN; locally the container in
 * wzd_auth/infrastructure/local). One origin is what lets Ward's cookie, its
 * redirect back to /prm/ and signing out work as they do in the deploy.
 *
 * Ward refuses /refresh and /logout unless the request's Origin is its own. A
 * request from a page on this dev server would be same-origin in the deploy, so
 * its Origin is rewritten to say so. Anything else keeps its Origin and its
 * Sec-Fetch-Site, and Ward still refuses it.
 */
function devProxy(): Record<string, ProxyOptions> {
  const proxy: Record<string, ProxyOptions> = {
    "/prm-api": {
      target: `http://localhost:${process.env.PORT ?? 3001}`,
      rewrite: (url) => url.replace(/^\/prm-api/, ""),
    },
  };
  if (!process.env.WARD_PUBLIC_ORIGIN) return proxy;

  const ward = new URL(process.env.WARD_PUBLIC_ORIGIN).origin;
  proxy["^/ward(-api)?(/|$)"] = {
    target: ward,
    configure: (server) => {
      server.on("proxyReq", (proxyReq, req) => {
        const origin = req.headers.origin;
        if (origin && URL.canParse(origin) && new URL(origin).host === req.headers.host) {
          proxyReq.setHeader("origin", ward);
        }
      });
    },
  };
  return proxy;
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
