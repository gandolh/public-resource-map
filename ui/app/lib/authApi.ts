import { configureAuth, type AuthError } from "../../vendor/ward/ward-auth-react.js";

/**
 * prm's accounts, as the browser reaches them (brief 24 of Ward's corpus).
 *
 * prm has its own users now: a login page, a register page and a settings
 * page, all prm's, built on the unstyled hooks of Ward's shared library
 * (`ui/vendor/ward`). "Sign in with Ward" is a button on the login page, shown
 * when the server has Ward configured.
 *
 * The hooks talk to the plugin's routes under the API prefix, on this origin
 * (`/prm-api/auth/...`; the dev server proxies it as Caddy does). The session
 * cookie is scoped to that prefix, so every API call must stay same-origin.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? "/prm-api";

/** Point the library's hooks at prm's auth routes. Runs once, on first import. */
export const authClient = configureAuth({ basePath: `${API_BASE}/auth` });

/** The app's base path, `/prm/` in the deploy, without its trailing slash. */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

/** prm's view of the signed-in person. */
export interface PrmUser {
  /** The local user id: the key favourites and notifications are stored under. */
  id: string;
  username: string;
  /** `role === "admin"`: prm's own role, not a Ward grant. */
  isAdmin: boolean;
}

/** This page as a full browser path, for `?next=`: Ward's `returnTo` needs one. */
export function browserPath(pathname: string, search = ""): string {
  return `${BASE}${pathname}${search}`;
}

/**
 * Where to go after signing in: `next` when it is a path inside prm, else
 * prm's home. Returns a **browser** path (with the base) for Ward's
 * `returnTo`, and a **router** path for a local navigation.
 */
export function safeNext(next: string | null): { browser: string; router: string } {
  const home = { browser: `${BASE}/`, router: "/" };
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return home;
  if (BASE && next !== BASE && !next.startsWith(`${BASE}/`) && !next.startsWith(`${BASE}?`)) return home;
  const router = next.slice(BASE.length) || "/";
  // Never back into the auth pages themselves.
  if (/^\/(login|register)(\/|\?|$)/.test(router)) return home;
  return { browser: next, router };
}

/** The login page, coming back to `next` (a browser path) afterwards. */
export function loginPath(next?: string): string {
  return next ? `/login?next=${encodeURIComponent(next)}` : "/login";
}

/** The register page, coming back to `next` (a browser path) afterwards. */
export function registerPath(next?: string): string {
  return next ? `/register?next=${encodeURIComponent(next)}` : "/register";
}

/**
 * The i18n key for an error code from the library. Unknown codes read as a
 * generic failure; Ward may send OAuth codes this list does not name.
 */
export function authErrorKey(error: AuthError | null | undefined): string | null {
  if (!error) return null;
  const known = new Set([
    "invalid_credentials",
    "too_many_attempts",
    "invalid_username",
    "password_too_short",
    "password_too_long",
    "username_taken",
    "network",
    "access_denied",
    "ward_unavailable",
    "ward_misconfigured",
    "ward_session_ended",
    "invalid_callback",
    "already_linked",
    "ward_account_in_use",
    "ward_account_mismatch",
    "not_linked",
    "no_local_password",
    "reauthentication_required",
    "unauthorized",
  ]);
  return `authError.${known.has(error.code) ? error.code : "unknown"}`;
}
