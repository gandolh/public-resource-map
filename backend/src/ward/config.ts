/**
 * Ward configuration, resolved **lazily** on first use.
 *
 * ## Lazily, and that is the decision rather than a style choice
 *
 * The obvious shape is to validate at import and `process.exit(1)` on a missing
 * variable, which is what prm's other config does. It is wrong here, for a
 * reason that showed up immediately: `buildApp` accepts an injected Ward client
 * so tests can decide who is signed in without a network, and an import-time
 * exit would kill the test worker before that injection ever happened. Every
 * API test in this repo would demand three production secrets to construct an
 * app that never calls Ward.
 *
 * Reading on first use keeps the failure exactly as loud where it matters — the
 * real client reads all three while `registerWard` is constructing it, which is
 * still during boot, before the server listens — while leaving an app that does
 * not use the real client able to exist.
 *
 * ## All three are required, and none has a default
 *
 * A missing one is a total outage rather than a degraded mode:
 * `POST /ward-api/introspect` refuses every unkeyed call, so prm's whole
 * authenticated surface would 503 while the public map carried on working.
 * That is the most confusing possible way for this to fail, so it fails at
 * startup instead.
 */

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `${name} is not set. prm cannot authenticate anybody without it — see .env.example.`,
    );
  }
  return value;
}

export interface WardConfig {
  /** Ward's public origin, and the exact `iss` every access token must carry. */
  publicOrigin: string;
  /**
   * Ward's prefix behind Caddy — `/ward-api` in this estate.
   *
   * No default, deliberately: an empty value resolves the JWKS to
   * `<origin>/.well-known/jwks.json`, a path nothing serves, which would make
   * prm reject every token with a clean log on the deploy that shipped it.
   */
  apiBasePath: string;
  /**
   * prm's own Ward service key. **A secret** — server-side only, never exposed
   * to the UI, never logged. Issued once from Ward's console and not readable
   * back.
   */
  appKey: string;
}

export function wardConfig(): WardConfig {
  return {
    publicOrigin: required("WARD_PUBLIC_ORIGIN").replace(/\/+$/, ""),
    apiBasePath: required("WARD_API_BASE_PATH"),
    appKey: required("WARD_APP_KEY"),
  };
}
