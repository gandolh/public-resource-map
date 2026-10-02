# prm UI

The Public Resource Map front end: React Router in **SPA mode** (`ssr: false`), Vite, Tailwind, Leaflet. The repo-root [README](../README.md) is the place to start; this covers the UI workspace alone.

```bash
npm run dev        # Vite dev server on :5173, served under PRM_BASE (/prm/ via the root .env)
npm run build      # static build in build/client
npm start          # preview that build on :4173, same base and same /prm-api proxy as dev
npm run typecheck
```

Both `dev` and `start` read the repo-root `.env`. The `/prm-api` proxy (and `/ward`, `/ward-api` when `WARD_PUBLIC_ORIGIN` is set) needs the backend running on `PORT` (3001).

**How it ships:** there is no UI server and no UI container. The deploy builds `build/client` with `PRM_BASE` and `VITE_API_URL` set and Caddy serves it as static files ([corpus → Deployment](../corpus/wiki/decisions.md)). The template's `react-router-serve`, its Dockerfile and the shadcn `components.json` were removed in brief 28.
