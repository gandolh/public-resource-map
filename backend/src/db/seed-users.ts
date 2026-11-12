import { seedUsers } from "../../vendor/ward/ward-auth.js";
import { loadSeedConfig } from "../config.js";
import { ROLES } from "../plugins/auth/index.js";
import { fromEnvOrPrompt, openAccounts } from "./accounts-cli.js";

/**
 * `npm run db:seed-users -w backend`: create one local user, from
 *
 *   SEED_USERNAME   the username
 *   SEED_PASSWORD   their password (at least the library's minimum length)
 *   SEED_ROLE       `user` (default) or `admin`
 *
 * or, for whichever is missing, a prompt on the terminal. Nothing comes from a
 * file in the repository. A user that exists is left exactly as it is (no
 * password or role reset), so this is safe on every deploy. People who sign in
 * with Ward need no seeding, and anyone can register on the site; this is for
 * the first admin, and for test users.
 */

const settings = loadSeedConfig();
const username = await fromEnvOrPrompt(settings.seedUsername, "Username");
const password = await fromEnvOrPrompt(settings.seedPassword, "Password", { secret: true });
const role = settings.seedRole ?? ROLES.user;

if (!username || !password) {
  console.error("Set SEED_USERNAME and SEED_PASSWORD, or run this on a terminal to be asked.");
  process.exit(1);
}
if (role !== ROLES.user && role !== ROLES.admin) {
  console.error(`SEED_ROLE must be "${ROLES.user}" or "${ROLES.admin}".`);
  process.exit(1);
}

const { accounts, close } = openAccounts(settings.databasePath);
try {
  const result = await seedUsers(accounts, [{ username, password, role }]);
  console.log(
    result.created.length > 0
      ? `Created ${role} ${username}.`
      : `${username} already exists; left as it is (db:set-role changes a role).`,
  );
} catch (err) {
  console.error("Seeding users failed:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  close();
}
