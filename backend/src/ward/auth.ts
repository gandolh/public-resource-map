import type { FastifyInstance } from "fastify";
import type BetterSqlite3 from "better-sqlite3";
import {
  createAccounts,
  createSqliteStore,
  createWardClient,
  createWardIdentities,
  wardAuth,
  wardClientOptionsFromEnv,
  type Accounts,
  type SqliteHandle,
  type WardClient,
  type WardIdentities,
} from "../../vendor/ward/ward-auth.js";

/**
 * prm's accounts (brief 24 of Ward's corpus; decisions.md → Accounts).
 *
 * prm owns its users now: `auth_users`, scrypt passwords, opaque sessions in
 * the `prm_session` cookie, all from Ward's shared library, vendored in
 * `backend/vendor/ward`. "Sign in with Ward" is a second way in, on when
 * `WARD_OIDC_ISSUER` is set. prm is the one app in the estate with a register
 * page, and that page is prm's own.
 *
 * ## Public by allowlist, because the library guards everything else
 *
 * prm is a public map: browsing needs no session. The plugin's guard refuses
 * every route that is not listed below, so a new route is signed-in only
 * until somebody decides otherwise, which is the safe way round. A listed
 * route never resolves a session (`request.auth` stays null), so nothing
 * public may depend on who is asking; the UI asks `GET /auth/session`.
 *
 * ## Paths, as the browser sees them
 *
 * Caddy (and the dev server's proxy) serve the API under `/prm-api` and strip
 * it, so Fastify sees `/auth/...` and `/api/...`. The cookie path is the
 * browser's prefix, `/prm-api`, and Ward's callback is
 * `/prm-api/auth/ward/callback`, which rides the same proxy rule.
 */

/** The browser-visible API prefix: the cookie's `Path`. */
export const API_PREFIX = "/prm-api";

/** The public reads. Patterns as Fastify resolves them; `GET` covers `HEAD`. */
export const PUBLIC_ROUTES = [
  "GET /health",
  "GET /api/places",
  "GET /api/places/:id",
  "GET /api/places/:id/events",
  "GET /api/events",
  "GET /api/events/:id",
  "GET /api/whats-on",
  "GET /api/archive",
] as const;

/** prm's two roles. They live in prm's own rows; Ward's grant only seeds a new user's. */
export const ROLES = { user: "user", admin: "admin" } as const;

export interface AuthOptions {
  /** The better-sqlite3 handle under Drizzle: the library's tables live beside prm's. */
  sqlite: BetterSqlite3.Database;
  /**
   * The Ward client. `undefined` builds one from the environment (none when
   * `WARD_OIDC_ISSUER` is unset); `null` means no Ward, whatever the
   * environment says. Tests inject one with a fake `fetch`.
   */
  wardClient?: WardClient | null;
  /** `PUBLIC_ORIGIN`; tests pass their own. */
  publicOrigin?: string;
}

export interface Auth {
  accounts: Accounts;
  identities: WardIdentities;
  /** Absent when Ward is not configured: local accounts only, and no mail. */
  wardClient: WardClient | undefined;
}

/**
 * The better-sqlite3 handle, as the library's store takes it. The same object
 * at runtime; only the types disagree: prm's `@types/better-sqlite3` (7.6)
 * types `prepare(...).run` with a parameter shape the library's structural
 * `SqliteHandle` does not accept.
 */
export function storeHandle(sqlite: BetterSqlite3.Database): SqliteHandle {
  return sqlite as unknown as SqliteHandle;
}

/**
 * `PUBLIC_ORIGIN`: required in production. A wrong value is a total sign-in
 * outage with a confusing face (every browser POST refused as `cross_site`,
 * the cookie without `Secure`), so a missing one stops the boot instead of
 * falling back to the development origin.
 */
function publicOrigin(env: NodeJS.ProcessEnv = process.env): string {
  const value = env.PUBLIC_ORIGIN?.trim();
  if (value) return value;
  if (env.NODE_ENV === "production") {
    throw new Error("PUBLIC_ORIGIN is not set: prm's sign-in needs its public origin (see .env.example).");
  }
  return "http://localhost:5173";
}

/** The app's base path, `/prm/` by default, as the UI is built with it. */
function appBase(env: NodeJS.ProcessEnv = process.env): string {
  const base = (env.PRM_BASE ?? "/prm/").trim();
  return base.endsWith("/") ? base : `${base}/`;
}

/**
 * Build the accounts and register the plugin. Call it **before any route**:
 * the guard is a hook on the root instance, and Fastify copies hooks into a
 * child only when the child is created.
 */
export async function registerAuth(app: FastifyInstance, options: AuthOptions): Promise<Auth> {
  const accounts = createAccounts({ store: createSqliteStore(storeHandle(options.sqlite)) });
  const identities = createWardIdentities({ accounts });

  let wardClient: WardClient | undefined;
  if (options.wardClient === undefined) {
    // Checks the key at boot; never contacts Ward, so prm starts while Ward is down.
    const fromEnv = wardClientOptionsFromEnv();
    wardClient = fromEnv === undefined ? undefined : await createWardClient(fromEnv);
  } else {
    wardClient = options.wardClient ?? undefined;
  }

  const base = appBase();
  await app.register(wardAuth, {
    accounts,
    cookieName: "prm_session",
    cookiePath: API_PREFIX,
    publicOrigin: options.publicOrigin ?? publicOrigin(),
    publicRoutes: [...PUBLIC_ROUTES],
    registration: { role: ROLES.user },
    ...(wardClient && {
      ward: {
        client: wardClient,
        identities,
        loginPath: `${base}login`,
        settingsPath: `${base}settings`,
        afterSignInPath: base,
        // A grant names a role; prm knows two. Anything else starts as a user.
        roleFor: (wardRole: string) => (wardRole === ROLES.admin ? ROLES.admin : ROLES.user),
      },
    }),
  });

  return { accounts, identities, wardClient };
}
