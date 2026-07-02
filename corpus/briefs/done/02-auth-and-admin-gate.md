# Brief 02 — Auth & admin gate

> **Rescoped 2026-06-28.** Brief 02 was a single oversized "admin source-ingestion" spec; it was split into 02–06 (see [index.md](../../index.md)). This brief is now **just auth + the admin gate** — the prerequisite for all admin/ingestion work. Implements [decisions.md → Auth](../../wiki/decisions.md) and [decisions.md → Favorites & notifications](../../wiki/decisions.md) (user table only).

## Goal

Full end-user auth (the POC's demoed retention foundation) plus an **admin gate** that protects every ingestion/admin endpoint. Everything else (places, ingestion, favorites, admin UI) depends on this.

## Scope

- **Email + password, self-hosted** — no managed provider. Matches house style.
- **Hashing: argon2id** (never plaintext/SHA).
- **Sessions: opaque session id** in an **httpOnly + Secure + SameSite** cookie, stored server-side in SQLite. Not a JWT in localStorage. Use `@fastify/cookie`.
- **Verify + reset flows built now**; email delivery **console-logged links in dev** (swap a transactional provider before launch).
- **Admin role/flag** on the user — a single admin is enough for the POC (env-configured seed admin acceptable). A reusable `requireAdmin` guard for admin routes.
- Make the Navbar profile dropdown **real** (currently decorative).

## Data model (Drizzle/SQLite)

- `user` — id, email (unique), passwordHash, `isAdmin`, `emailVerifiedAt`, createdAt.
- `session` — id (opaque), userId, expiresAt, createdAt.
- `verification_token` / `reset_token` — single-use, expiring (userId, token, expiresAt, usedAt).

## API

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | create user → send verify link (console in dev) |
| POST | `/api/auth/verify` | consume verification token |
| POST | `/api/auth/login` | set session cookie |
| POST | `/api/auth/logout` | clear session |
| GET | `/api/auth/me` | current user (or 401) |
| POST | `/api/auth/request-reset` | send reset link (console in dev) |
| POST | `/api/auth/reset` | consume reset token, set new password |

`requireAdmin` middleware guards all `/api/admin/*` routes (added by later briefs).

## Testing

Thin **Vitest** suite for auth internals (the breach-risk behaviors e2e can't see): password hashing round-trip, single-use reset/verify tokens, session expiry. Plus an e2e happy-path (register → verify → login → see profile).

## Acceptance criteria

- A user can register, verify (via console link in dev), log in, see `/api/auth/me`, and log out.
- Reset flow issues a single-use, expiring token; reused/expired tokens are rejected.
- Passwords are argon2id-hashed; sessions are opaque, server-side, httpOnly+Secure+SameSite.
- `requireAdmin` rejects non-admins (403) and unauthenticated requests (401).
- Navbar profile reflects real auth state.
