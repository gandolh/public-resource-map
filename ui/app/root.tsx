import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration, Link } from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { THEME_BOOT_SCRIPT, THEME_COLORS } from "~/lib/theme";

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

  FIRST VIEWPORT: A docked band above the map holds the search, the timing
  lens, the category chips, the count and Draw an area. The map fills the
  rest; the place column docks on its left on desktop, and on a phone a sheet
  sized to its content rests above a four-tab bar. The map's box ends where
  the column begins, so the selected pin is never covered.

  FORM: The standing exit, taken deliberately over the dealt roll.
  Craft bar: Citymapper and Linear.

  FINISH: unreviewed and undocumented is unfinished; this build ends with the
  finish review, the verdict, DESIGN.md, and every shipping raster carrying
  its provenance.
-->`;

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {/* One colour, rewritten by the boot script and by the theme provider, so the browser bar follows the switch. */}
        <meta name="theme-color" content={THEME_COLORS.light} />
        {/* Sets data-theme before the first paint, so a returning dark visitor never sees a light flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
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
  const stack = import.meta.env.DEV && error instanceof Error ? error.stack : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg p-6 text-fg">
      <div className="w-full max-w-md">
        <p className="text-ui font-semibold text-fg-muted">{notFound ? "404" : "Eroare"}</p>
        <h1 className="mt-2 text-hero font-semibold tracking-[-0.015em]">{title}</h1>
        <p className="mt-2 text-fg-muted">{detail}</p>
        <Link
          to="/"
          className="mt-6 inline-flex h-10 items-center rounded-lg border border-accent bg-accent px-4 text-body font-semibold text-fg-on-accent transition-colors hover:bg-accent-hover"
        >
          Înapoi la hartă
        </Link>
        {stack && (
          <pre className="mt-6 max-h-64 overflow-auto rounded-lg border border-line bg-surface-2 p-3 font-mono text-meta text-fg-muted">
            <code>{stack}</code>
          </pre>
        )}
      </div>
    </main>
  );
}
