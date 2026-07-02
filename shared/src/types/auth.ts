import { z } from "zod";

export const userRoles = ["user", "admin"] as const;
export const userRoleSchema = z.enum(userRoles);
export type UserRole = z.infer<typeof userRoleSchema>;

/**
 * The safe, client-facing shape of a user — the `/api/auth/me` response and the
 * `user` field of login/register responses. NEVER includes `passwordHash`.
 */
export const publicUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string().nullable(),
  role: userRoleSchema,
  emailVerified: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type PublicUser = z.infer<typeof publicUserSchema>;

// --- Request payloads ------------------------------------------------------

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
  displayName: z.string().min(1).max(120).optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const verifyTokenSchema = z.object({
  token: z.string().min(1),
});
export type VerifyTokenInput = z.infer<typeof verifyTokenSchema>;

export const requestResetSchema = z.object({
  email: z.string().email(),
});
export type RequestResetInput = z.infer<typeof requestResetSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(200),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
