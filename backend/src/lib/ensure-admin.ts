import { eq } from "drizzle-orm";
import type { DB } from "../db/index.js";
import { user } from "../db/schema.js";
import { hashPassword } from "./auth-internals.js";

/**
 * Seed / promote a single admin from env config (ADMIN_EMAIL + ADMIN_PASSWORD).
 * A single admin is enough for the POC. Idempotent:
 *   - no ADMIN_EMAIL   → no-op
 *   - user exists      → promote to `admin` (+ mark verified) if not already
 *   - user missing     → create an admin (requires ADMIN_PASSWORD)
 * Called at prod startup (index.ts) and from the seed. Not called in buildApp()
 * so tests stay fast and deterministic.
 */
export async function ensureAdmin(db: DB): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email) return;

  const existing = await db
    .select()
    .from(user)
    .where(eq(user.email, email))
    .get();

  if (existing) {
    if (existing.role !== "admin" || !existing.emailVerified) {
      await db
        .update(user)
        .set({
          role: "admin",
          emailVerified: true,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(user.id, existing.id));
      console.log(`[ensureAdmin] promoted ${email} to admin`);
    }
    return;
  }

  if (!password) {
    console.warn(
      `[ensureAdmin] ADMIN_EMAIL set but no user exists and ADMIN_PASSWORD is unset — skipping admin creation`,
    );
    return;
  }

  const passwordHash = await hashPassword(password);
  await db.insert(user).values({
    email,
    passwordHash,
    displayName: "Administrator",
    role: "admin",
    emailVerified: true,
  });
  console.log(`[ensureAdmin] created admin ${email}`);
}
