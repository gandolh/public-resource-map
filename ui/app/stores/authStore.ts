import { create } from "zustand";

import { authClient, type PrmUser } from "~/lib/authApi";
import { queryClient } from "~/lib/queryClient";
import type { SessionState } from "../../vendor/ward/ward-auth-react.js";

/**
 * Who is signed in, as prm sees it: a view of the shared library's session
 * state (`lib/authApi.ts`), shaped the way prm's components already read it.
 *
 * Signing in, registering and signing out are the library's hooks, used by
 * the login, register and settings pages; whatever they do lands here, since
 * the hooks and this store read one session state.
 *
 * ## There is no "Ward is down" status any more
 *
 * A local session never depends on Ward. A session that began with Ward is
 * refused while Ward cannot vouch for it, and the person is then signed out
 * with `reason: "ward_unavailable"`: the login page says so and offers the
 * local password. An API that does not answer at all is treated as anonymous,
 * because the public map needs no session.
 */
type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  user: PrmUser | null;
  status: AuthStatus;
  /** `role === "admin"` in prm's own users. */
  isAdmin: boolean;
  /** Why a presented session was refused, e.g. `ward_unavailable`. */
  reason: string | null;
  /** Load the session once, and follow every change from then on. */
  bootstrap: () => Promise<void>;
}

function fromSession(state: SessionState): Omit<AuthState, "bootstrap"> {
  switch (state.status) {
    case "loading":
      return { user: null, isAdmin: false, reason: null, status: "loading" };
    case "signed_in": {
      const isAdmin = state.user.role === "admin";
      return {
        user: { id: state.user.id, username: state.user.username, isAdmin },
        isAdmin,
        reason: null,
        status: "authenticated",
      };
    }
    case "signed_out":
      return { user: null, isAdmin: false, reason: state.reason ?? null, status: "unauthenticated" };
    case "error":
      return { user: null, isAdmin: false, reason: null, status: "unauthenticated" };
  }
}

let following = false;
let lastUserId: string | null = null;

/**
 * Signing in and out no longer reloads the page, so one person's favourites,
 * inbox and history must not outlive their session in the query cache.
 */
function forgetPersonalData(userId: string | null): void {
  if (userId === lastUserId) return;
  lastUserId = userId;
  queryClient.removeQueries({ queryKey: ["me"] });
  queryClient.removeQueries({ queryKey: ["archive", "mine"] });
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "idle",
  isAdmin: false,
  reason: null,

  bootstrap: async () => {
    if (!following) {
      following = true;
      authClient.subscribe(() => {
        const next = fromSession(authClient.getState());
        if (next.status !== "loading") forgetPersonalData(next.user?.id ?? null);
        set(next);
      });
    }
    set({ status: "loading" });
    await authClient.refresh();
  },
}));
