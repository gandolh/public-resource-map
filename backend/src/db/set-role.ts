import { ROLES } from "../ward/auth.js";
import { openAccounts } from "./accounts-cli.js";

/**
 * `npm run db:set-role -w backend -- <username> <user|admin>`: change a local
 * user's role. The role is prm's (a Ward grant only seeds a new user's), and
 * this is how it changes, the first admin included: a person whose rows were
 * keyed by their Ward subject became a `user` named `user-<8 characters>` in
 * brief 24's migration, whatever grant they held.
 */

const [username, role] = process.argv.slice(2);
if (!username || (role !== ROLES.user && role !== ROLES.admin)) {
  console.error(`Usage: npm run db:set-role -w backend -- <username> <${ROLES.user}|${ROLES.admin}>`);
  process.exit(1);
}

const { accounts, close } = openAccounts();
try {
  const user = await accounts.findUserByUsername(username);
  if (!user) {
    console.error(`No user named ${username}.`);
    process.exitCode = 1;
  } else {
    await accounts.setRole(user.id, role);
    console.log(`${user.username} is now ${role}.`);
  }
} finally {
  close();
}
