import path from "node:path";
import fs from "node:fs";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { createAccounts, createSqliteStore, type Accounts } from "../../vendor/ward/ward-auth.js";
import { storeHandle } from "../ward/auth.js";

/**
 * What the account scripts (`seed-users.ts`, `set-role.ts`, the demo user in
 * `seed.ts`) share: the database they open, and how they ask for a value the
 * environment did not give. Credentials come from the environment or a
 * prompt, never from a file in the repository.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const dbPath = process.env.DATABASE_PATH ?? path.resolve(__dirname, "../../data/app.db");

/** The accounts over the app's database. The library creates its tables on open. */
export function openAccounts(file: string = dbPath): { accounts: Accounts; close: () => void } {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const sqlite = new Database(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");
  return { accounts: createAccounts({ store: createSqliteStore(storeHandle(sqlite)) }), close: () => sqlite.close() };
}

/**
 * `process.env[name]`, or the answer to a prompt when there is a terminal to
 * ask on. `secret` keeps the answer off the screen. `undefined` when neither.
 */
export async function fromEnvOrPrompt(
  name: string,
  question: string,
  { secret = false }: { secret?: boolean } = {},
): Promise<string | undefined> {
  const value = process.env[name]?.trim();
  if (value) return value;
  if (!process.stdin.isTTY) return undefined;

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  if (secret) {
    // Echo nothing after the question itself.
    const out = rl as unknown as { _writeToOutput: (s: string) => void };
    let asked = false;
    out._writeToOutput = (s: string) => {
      if (!asked) {
        process.stdout.write(s);
        asked = true;
      }
    };
  }
  const answer = await new Promise<string>((resolve) => rl.question(`${question}: `, resolve));
  rl.close();
  if (secret) process.stdout.write("\n");
  return answer.trim() || undefined;
}
