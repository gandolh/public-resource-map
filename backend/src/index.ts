import { buildApp } from "./app.js";
import { startReminderSweep } from "./jobs/reminder-sweep.js";

/*
 * Users are prm's own (brief 24 of Ward's corpus). Nothing is seeded on boot:
 * `npm run db:seed-users -w backend` creates users from the environment and
 * never resets a password or a role, so it is safe on every deploy, and
 * `db:set-role` promotes an existing user. Boot does move rows keyed by a Ward
 * subject onto linked local users (`ward/subjects.ts`), once.
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
