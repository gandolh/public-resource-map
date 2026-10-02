/**
 * Whether a database error is SQLite refusing a write because another row
 * still references this one (`foreign_keys=ON`, and the referencing column has
 * no `ON DELETE`). Drizzle may wrap the driver's error, so the cause chain is
 * walked.
 *
 * Routes map this to a 409 instead of letting it escape as a 500: deleting a
 * place that still has events is a refusal, not a server fault (brief 18).
 */
export function isForeignKeyViolation(error: unknown): boolean {
  for (
    let e = error as { code?: unknown; cause?: unknown } | undefined, depth = 0;
    e && depth < 5;
    depth++
  ) {
    if (e.code === "SQLITE_CONSTRAINT_FOREIGNKEY") return true;
    e = e.cause as typeof e;
  }
  return false;
}
