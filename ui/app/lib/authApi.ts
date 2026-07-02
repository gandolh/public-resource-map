import type {
  LoginInput,
  PublicUser,
  RegisterInput,
} from "@public-resource-map/shared";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export interface AuthApiError {
  code: string;
  message: string;
}

async function authRequest<T>(
  path: string,
  body?: unknown,
  method: "GET" | "POST" = "POST",
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    // send + receive the httpOnly session cookie cross-origin
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as T & Partial<AuthApiError>;
  if (!res.ok) {
    const err = data as unknown as AuthApiError;
    throw new Error(err?.message || `Request failed (${res.status})`);
  }
  return data as T;
}

interface UserResponse {
  user: PublicUser;
}

/** Returns the current user, or null if not signed in (401). */
export async function fetchMe(): Promise<PublicUser | null> {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    credentials: "include",
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const data = (await res.json()) as UserResponse;
  return data.user;
}

export async function loginRequest(input: LoginInput): Promise<PublicUser> {
  const { user } = await authRequest<UserResponse>("/api/auth/login", input);
  return user;
}

export async function registerRequest(
  input: RegisterInput,
): Promise<PublicUser> {
  const { user } = await authRequest<UserResponse>(
    "/api/auth/register",
    input,
  );
  return user;
}

export async function logoutRequest(): Promise<void> {
  await authRequest<{ ok: true }>("/api/auth/logout", {});
}

export async function verifyRequest(token: string): Promise<void> {
  await authRequest<{ ok: true }>("/api/auth/verify", { token });
}

export async function requestResetRequest(email: string): Promise<void> {
  await authRequest<{ ok: true }>("/api/auth/request-reset", { email });
}

export async function resetPasswordRequest(
  token: string,
  password: string,
): Promise<void> {
  await authRequest<{ ok: true }>("/api/auth/reset", { token, password });
}
