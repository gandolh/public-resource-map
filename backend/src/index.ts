import { buildApp } from "./app.js";
import { ensureAdmin } from "./lib/ensure-admin.js";

const app = await buildApp({ logger: true });

// Seed / promote the env-configured admin (no-op if ADMIN_EMAIL is unset).
await ensureAdmin(app.db);

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "0.0.0.0";

try {
  await app.listen({ port, host });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
