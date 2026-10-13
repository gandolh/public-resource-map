import type BetterSqlite3 from "better-sqlite3";
import { UsernameTakenError, type WardIdentities } from "../../vendor/ward/ward-auth.js";
import { ROLES } from "./auth.js";

/**
 * The one-time move from Ward subjects to prm's own users (brief 24 of Ward's
 * corpus; the adoption guide's section 7).
 *
 * Until 2026-10-13 prm had no users: favourites and notifications were keyed
 * by the Ward **subject** of whoever made them. Now they are keyed by a local
 * user id. To keep every row pointing at its person without rewriting one,
 * each subject the rows know becomes a local user **whose id is that
 * subject**, linked to it. That person's next "Sign in with Ward" finds the
 * linked user, and the user's id is what the rows already hold.
 *
 * ## What prm did not keep, and what it guesses instead
 *
 * prm never stored a Ward username or role. So a migrated user is named
 * `user-<first 8 characters of the subject>` and starts as a `user`, whatever
 * grant they held. A former admin is promoted by hand afterwards
 * (`npm run db:set-role -w backend`). The username can be anything later; it
 * is never how a person is found.
 *
 * ## Safe to run on every boot
 *
 * A row key that is already a local user id is skipped: that covers a subject
 * migrated before, and every row written since, which is keyed by a local id
 * from the start. Each user and its link are created together or not at all.
 */

/** The row keys no local user has: subjects from before the move. */
function unknownKeys(sqlite: BetterSqlite3.Database): string[] {
  const rows = sqlite
    .prepare(
      `SELECT k.subject AS subject FROM (
         SELECT subject FROM favorite_place
         UNION SELECT subject FROM favorite_event
         UNION SELECT subject FROM notification
       ) AS k
       LEFT JOIN auth_users u ON u.id = k.subject
       WHERE u.id IS NULL
       ORDER BY k.subject`,
    )
    .all() as { subject: string }[];
  return rows.map((r) => r.subject);
}

/** `user-1a2b3c4d`, or the whole subject if two subjects share a prefix. */
function placeholderNames(subject: string): string[] {
  const short = `user-${subject.slice(0, 8)}`;
  const long = `user-${subject}`;
  return short === long ? [short] : [short, long];
}

export interface AdoptResult {
  /** The subjects that became users on this run. */
  created: string[];
  /** Subjects whose placeholder names were both taken: logged, and tried again next boot. */
  skipped: string[];
}

/** Create a linked local user for every subject prm's rows know and no user has. */
export async function adoptWardSubjects(
  sqlite: BetterSqlite3.Database,
  identities: WardIdentities,
): Promise<AdoptResult> {
  const created: string[] = [];
  const skipped: string[] = [];
  for (const subject of unknownKeys(sqlite)) {
    // Linked to another id already: the rows still say this subject, and the
    // person signs in as that other user. Nothing to create, nothing to guess.
    if (await identities.findUserBySubject(subject)) continue;

    let done = false;
    for (const username of placeholderNames(subject)) {
      try {
        await identities.createLinkedUser({ subject, id: subject, username, role: ROLES.user });
        done = true;
        break;
      } catch (error) {
        if (error instanceof UsernameTakenError) continue;
        throw error;
      }
    }
    (done ? created : skipped).push(subject);
  }
  return { created, skipped };
}
