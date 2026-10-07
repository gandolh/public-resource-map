import { buildApp } from "./app.js";
import { startReminderSweep } from "./jobs/reminder-sweep.js";

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

// Day-before reminders (brief 05): in-process, here rather than in buildApp so
// a test's app never starts a timer. The timer is unref'd, so it never holds
// the process open. Each run then kicks the notification mail (brief 32).
startReminderSweep(app.db, (msg) => app.log.info(msg), () => app.notifyMail.kick());
