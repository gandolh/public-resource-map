import closeWithGrace from "close-with-grace";
import { buildApp } from "./app.js";
import { ConfigError, loadConfig, type Config } from "./config.js";
import { startReminderSweep } from "./features/reminders/index.js";

/*
 * The process: settings, the app, shutdown, listen. Nothing else listens.
 *
 * Users are prm's own (since 2026-10-13). Nothing is seeded on boot:
 * `npm run db:seed-users -w backend` creates users from the environment and
 * never resets a password or a role, so it is safe on every deploy, and
 * `db:set-role` promotes an existing user. Boot does move rows keyed by a Ward
 * subject onto linked local users (`plugins/auth/subjects.ts`), once.
 */
let config: Config;
try {
  config = loadConfig();
} catch (error) {
  // Before any logger exists: say which variables are wrong, and stop.
  if (!(error instanceof ConfigError)) throw error;
  console.error(`prm cannot start, the environment is not valid:\n${error.message}`);
  process.exit(1);
}

const app = await buildApp(config, {
  server: {
    logger: true,
    // Caddy's network, so `request.ip` is the client's address, not the proxy's. None: the socket peer.
    trustProxy: config.trustedProxies.length > 0 ? config.trustedProxies : false,
    // A socket silent this long mid-request is cut. The OSM sync waits up to 100 s on Overpass; the
    // two ingest refreshes, which can run longer, lift it on their own socket.
    connectionTimeout: 180_000,
    // The whole request, body included, must arrive within this.
    requestTimeout: 180_000,
    // Longer than Caddy keeps an idle upstream connection (2 minutes), so Caddy never sends a
    // request down a socket the server has just closed.
    keepAliveTimeout: 125_000,
  },
});

// SIGINT, SIGTERM, an uncaught error: stop taking requests, finish the ones in flight, wait for
// the mail in flight, close the database, and exit. After 10 s it exits anyway.
closeWithGrace({ delay: 10_000, logger: app.log }, async ({ signal, err }) => {
  if (err) app.log.error({ err }, "closing after an uncaught error");
  else app.log.info(`closing on ${signal ?? "request"}`);
  await app.close();
});

await app.listen({ port: config.port, host: config.host });

// Day-before reminders: in-process, here rather than in buildApp so
// a test's app never starts a timer. The timer is unref'd, so it never holds
// the process open. Each run then kicks the notification mail.
startReminderSweep(
  app.db,
  (msg) => app.log.info(msg),
  () => app.notifyMail.kick(),
);
