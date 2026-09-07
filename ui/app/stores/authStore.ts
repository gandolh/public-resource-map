import { create } from "zustand";

import { fetchMe, IdentityUnavailableError, type PrmUser } from "~/lib/authApi";

/**
 * Who is signed in, as prm sees it.
 *
 * ## There is no `login`, `register` or `logout` here
 *
 * They were removed rather than reimplemented. Signing in, signing up and
 * signing out are all **navigations to Ward**, not requests prm makes — see
 * `lib/authApi.ts`. A store method that looked like `login()` would imply prm
 * could authenticate somebody, which is exactly the thing that stopped being
 * true.
 *
 * ## `unavailable` is a fourth status, and it is not `unauthenticated`
 *
 * If Ward cannot be reached, prm does not know who anybody is — which is not
 * the same as knowing nobody is signed in. Collapsing the two would put a
 * "Sign in" button in front of somebody whose only route to signing in is the
 * service that is currently down, so the UI shows a different message.
 *
 * The public map keeps working in this state, because it never asks who anybody
 * is. That is a real property of prm's shape and worth not losing.
 */
type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated" | "unavailable";

interface AuthState {
  user: PrmUser | null;
  status: AuthStatus;
  /** Holds `prm:admin`. prm's reading of a Ward grant, resolved server-side. */
  isAdmin: boolean;
  /** Resolve the current person from Ward's cookie via `GET /api/me`. */
  bootstrap: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "idle",
  isAdmin: false,

  bootstrap: async () => {
    set({ status: "loading" });
    try {
      const user = await fetchMe();
      set({
        user,
        isAdmin: user?.isAdmin ?? false,
        status: user ? "authenticated" : "unauthenticated",
      });
    } catch (error) {
      if (error instanceof IdentityUnavailableError) {
        set({ user: null, isAdmin: false, status: "unavailable" });
        return;
      }
      // The API itself is unreachable. Treated as anonymous, because the public
      // map is what the person is looking at and it needs no session — the
      // per-request error states surface the outage where it matters.
      set({ user: null, isAdmin: false, status: "unauthenticated" });
    }
  },
}));
