import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  Link,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";

const DIRECTION_CONTRACT = `<!--
  DIRECTION CONTRACT — CivicMap (seed 6c65d315, scope: direction, mode: operate)

  THESIS: The public layer of a city, made findable. Refuses novelty: offered
  four visual worlds, the product took the category convention on purpose, so
  the interest lives in precision rather than invention.

  OWN-WORLD: Cool-biased neutrals, one blue accent, eleven category hues that
  are information rather than decoration. A 1px border is the default
  separator; shadow is spent only on what genuinely floats, and differs by
  role. Radii cap at 12px; pills mean "filter" and nothing else. Archivo,
  with tabular numerals wherever digits align.

  STORY: A resident opens the map on their city, sees which public places are
  near them, and learns what is on at one of them — or that nothing is, said
  plainly, because sparse is the honest default here.

  FIRST VIEWPORT: Full-bleed map. Search and category chips float top left,
  the timing lens sits bottom centre, the place panel docks right on desktop
  and becomes a draggable bottom sheet on mobile. The map is never smaller
  than the chrome, and the selected pin is panned clear of the panel.

  FORM: The standing exit, taken deliberately over the dealt roll.
  Craft bar: Citymapper and Linear.

  FINISH: unreviewed and undocumented is unfinished; this build ends with the
  finish review, the verdict, DESIGN.md, and every shipping raster carrying
  its provenance.
-->`;

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Archivo:wght@400..700&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0b0d11" media="(prefers-color-scheme: dark)" />
        <Meta />
        <Links />
      </head>
      <body>
        {/* The direction contract has to survive the production build, and a
            JSX comment does not reach the DOM at all — so it ships as real
            markup inside a hidden wrapper, greppable by its seed key. */}
        <div
          hidden
          aria-hidden="true"
          data-direction-contract="6c65d315"
          dangerouslySetInnerHTML={{ __html: DIRECTION_CONTRACT }}
        />
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  const title = notFound ? "Pagina nu există" : "Ceva n-a mers";
  const detail = notFound
    ? "Adresa nu duce nicăieri. Harta orașului e mai jos."
    : isRouteErrorResponse(error)
      ? error.statusText || "A apărut o eroare neașteptată."
      : "A apărut o eroare neașteptată.";
  const stack =
    import.meta.env.DEV && error instanceof Error ? error.stack : undefined;

  return (
    <main className="min-h-screen bg-bg text-fg flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-faint">
          {notFound ? "404" : "Eroare"}
        </p>
        <h1 className="mt-2 text-[24px] leading-tight font-semibold tracking-[-0.02em]">
          {title}
        </h1>
        <p className="mt-2 text-fg-muted">{detail}</p>
        <Link
          to="/"
          className="mt-6 inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-medium text-fg-on-accent transition-colors hover:bg-accent-hover"
        >
          Înapoi la hartă
        </Link>
        {stack && (
          <pre className="mt-6 max-h-64 overflow-auto rounded-lg border border-line bg-surface-2 p-3 font-mono text-[11px] text-fg-muted">
            <code>{stack}</code>
          </pre>
        )}
      </div>
    </main>
  );
}
