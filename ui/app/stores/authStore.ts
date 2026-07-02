import { create } from "zustand";
import type {
  LoginInput,
  PublicUser,
  RegisterInput,
} from "@public-resource-map/shared";
import {
  fetchMe,
  loginRequest,
  logoutRequest,
  registerRequest,
} from "~/lib/authApi";

type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  user: PublicUser | null;
  status: AuthStatus;
  isAdmin: boolean;
  /** Resolve the current user from the session cookie via /api/auth/me. */
  bootstrap: () => Promise<void>;
  login: (input: LoginInput) => Promise<PublicUser>;
  register: (input: RegisterInput) => Promise<PublicUser>;
  logout: () => Promise<void>;
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
        isAdmin: user?.role === "admin",
        status: user ? "authenticated" : "unauthenticated",
      });
    } catch {
      set({ user: null, isAdmin: false, status: "unauthenticated" });
    }
  },

  login: async (input) => {
    const user = await loginRequest(input);
    set({ user, isAdmin: user.role === "admin", status: "authenticated" });
    return user;
  },

  register: async (input) => {
    // Registration does not open a session (email verification is separate);
    // the caller decides what to do next (e.g. prompt to log in).
    return registerRequest(input);
  },

  logout: async () => {
    await logoutRequest();
    set({ user: null, isAdmin: false, status: "unauthenticated" });
  },
}));
