import { buildApp } from "./app.js";

/*
 * There is no admin to seed any more.
 *
 * `ensureAdmin` promoted an account named by `ADMIN_EMAIL`/`ADMIN_PASSWORD` on
 * every boot. prm holds no accounts and no roles: authority is a Ward grant,
 * and `prm:admin` is issued by hand from Ward's console — which is the point,
 * because an admin that a redeploy can recreate is an admin an environment
 * variable can silently grant.
 */
const app = await buildApp({ logger: true });

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "0.0.0.0";

try {
  await app.listen({ port, host });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
