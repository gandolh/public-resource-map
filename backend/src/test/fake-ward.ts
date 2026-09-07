import type { WardClient } from "../ward/ward.client.js";
import {
  WardAuthenticationError,
  type SessionResolution,
  type WardCaller,
} from "../ward/ward.types.js";

/**
 * A Ward client a test drives directly.
 *
 * Tests need to say "this request is an admin" without a signing key, a JWKS
 * endpoint, or a network. This maps a **cookie value** to a session, which is
 * the same shape a real request has: the test sets `cookie: ward_session=<key>`
 * and the guards do the rest.
 *
 * The seam is the client rather than the guards, deliberately. Stubbing
 * `requireAuth` would make the guard tests tautological — the thing actually
 * worth asserting is that `requireAdmin` refuses a session holding `prm:user`,
 * and that only holds if the real guard reads the real grant map.
 */
export interface FakeWard extends WardClient {
  /** Make `token` resolve to a live session holding `grants`. */
  signIn(token: string, subject: string, grants: Record<string, string[]>): void;
  /** Make every call throw `WardUnavailableError`, for the fail-closed tests. */
  breakWith(error: Error): void;
}

const COOKIE = "ward_session";

function tokenFrom(header: string | string[] | undefined): string | undefined {
  if (header === undefined) return undefined;
  const flat = Array.isArray(header) ? header.join("; ") : header;
  for (const pair of flat.split(";")) {
    const eq = pair.indexOf("=");
    if (eq === -1) continue;
    if (pair.slice(0, eq).trim() !== COOKIE) continue;
    const value = pair.slice(eq + 1).trim();
    return value.length > 0 ? value : undefined;
  }
  return undefined;
}

export function createFakeWard(): FakeWard {
  const sessions = new Map<string, WardCaller>();
  let broken: Error | undefined;

  function resolve(token: string | undefined): WardCaller {
    if (broken) throw broken;
    const session = token === undefined ? undefined : sessions.get(token);
    if (!session) throw new WardAuthenticationError("session is not active");
    return session;
  }

  return {
    signIn(token, subject, grants) {
      sessions.set(token, {
        active: true,
        subject,
        username: subject,
        grants,
        sid: `sid_${token}`,
      });
    },
    breakWith(error) {
      broken = error;
    },
    async verify() {
      throw new WardAuthenticationError("the fake client does not verify signatures");
    },
    async introspect(token): Promise<SessionResolution> {
      try {
        return resolve(token);
      } catch {
        return { active: false };
      }
    },
    readAccessCookie: tokenFrom,
    async authenticate(cookieHeader) {
      return resolve(tokenFrom(cookieHeader));
    },
  };
}
