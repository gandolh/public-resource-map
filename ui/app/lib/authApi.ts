/**
 * Who the browser is, and where to send somebody who needs to sign in.
 *
 * ## prm has no login form any more
 *
 * There is no `loginRequest`, no `registerRequest`, no `logoutRequest`, no
 * password reset and no email verification here. All of it is Ward's, at one
 * login page for the whole estate — and prm is the app that made public
 * registration part of Ward's design, so signing up is `/ward/register?app=prm`
 * rather than a form this app renders.
 *
 * What is left is one read and three URLs.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

/** prm's slug, in the Ward URLs below. */
const APP = "prm";

/** Where Ward sends people back to. A path — Ward refuses an absolute URL. */
const PRM_ROOT = "/prm/";

/** prm's view of the signed-in person. Deliberately narrow — see `routes/me.ts`. */
export interface PrmUser {
  /** Ward's opaque subject. The key every per-person row in prm is stored under. */
  subject: string;
  username: string;
  /** Whether this account holds `prm:admin`. prm's interpretation, not Ward's. */
  isAdmin: boolean;
}

/** Ward could not be reached. Distinct from "not signed in" — see `bootstrap`. */
export class IdentityUnavailableError extends Error {
  constructor() {
    super("Sign-in is temporarily unavailable");
    this.name = "IdentityUnavailableError";
  }
}

/**
 * The current person, or `null` when nobody is signed in.
 *
 * `null` is an ordinary answer on a public map, not a failure: most visitors
 * are anonymous and the whole app works for them.
 */
export async function fetchMe(): Promise<PrmUser | null> {
  const res = await fetch(`${API_BASE}/api/me`, {
    // Required: Ward's cookie must reach the API, which is a different origin
    // in development even though it is the same one in the deployed estate.
    credentials: "include",
  });

  if (res.status === 503) throw new IdentityUnavailableError();
  if (!res.ok) throw new Error(`Request failed (${res.status})`);

  const data = (await res.json()) as { user: PrmUser | null };
  return data.user;
}

/**
 * Ward's login page, returning here afterwards.
 *
 * `next` is a **path**, never an absolute URL: Ward validates it against the
 * estate's own path roots and refuses anything absolute, including the estate's
 * own origin spelled out in full.
 */
export function wardLoginUrl(next: string = PRM_ROOT): string {
  return `/ward/login?next=${encodeURIComponent(next)}`;
}

/**
 * Ward's registration page, for prm.
 *
 * `?app=prm` is load-bearing rather than cosmetic: Ward only offers
 * registration for an app whose `public_registration` flag is on, and prm is
 * the only one in the estate that has it. Registering there confers exactly
 * `prm:user` and nothing anywhere else.
 */
export function wardRegisterUrl(next: string = PRM_ROOT): string {
  return `/ward/register?app=${APP}&next=${encodeURIComponent(next)}`;
}

/**
 * Ward's account page, where signing out lives.
 *
 * prm has no logout of its own and must not fake one: a session is the
 * estate's, so ending it in one app while the others still honour it would be a
 * lie the cookie immediately contradicts.
 */
export function wardAccountUrl(): string {
  return "/ward/account";
}
