import { and, asc, eq, gte, isNull, sql } from "drizzle-orm";
import type { DB } from "../db/index.js";
import { event, notification, notificationEvent, place } from "../db/schema.js";
import type { NotificationInput, NotificationResult } from "../ward/ward.client.js";
import { WardUnavailableError } from "../ward/ward.types.js";
import { APP_TZ, zonedParts } from "./time.js";

/**
 * Notification email (brief 32; decisions.md → Favorites & notifications).
 *
 * prm holds no addresses, so Ward sends each mail on prm's behalf (`POST
 * /notify`). This sweep takes the inbox rows not yet mailed (`emailed_at IS
 * NULL`) and sends one mail per row. Rows are already coalesced where they are
 * written: an accept batch makes one new-events row per follower per place
 * (`notifyNewEvents`), so one mail per row is one mail per batch, as the inbox
 * shows one item.
 *
 * `emailed_at` is set when Ward answers, sent or refused: a refusal is final,
 * and the inbox still has the item. When Ward cannot be asked (down, or prm's
 * key refused) the row stays null and the sweep stops; the next sweep retries.
 * A row whose news is already past is marked without a mail.
 */

export type SendNotification = (input: NotificationInput) => Promise<NotificationResult>;
/** The two calls the sweep makes on Fastify's logger. */
export interface MailLog {
  info(msg: string): void;
  error(obj: object, msg: string): void;
}

/** Rows one sweep takes, oldest first. Ward allows prm 2,000 calls a day. */
export const MAIL_BATCH = 500;
/** Events listed in one new-events mail; the rest are counted. */
const MAX_LISTED = 20;

/**
 * Where links in a mail point: `APP_URL`, or else prm under Ward's origin,
 * since the estate serves both from one origin (`/prm/` by default).
 */
export function appUrl(env: NodeJS.ProcessEnv = process.env): string {
  const explicit = env.APP_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const origin = (env.WARD_PUBLIC_ORIGIN ?? "http://localhost:5173").trim().replace(/\/+$/, "");
  const base = (env.PRM_BASE ?? "/prm/").trim().replace(/\/+$/, "");
  return `${origin}${base}`;
}

const dayFmt = new Intl.DateTimeFormat("ro-RO", {
  timeZone: APP_TZ,
  weekday: "long",
  day: "numeric",
  month: "long",
});
const clockFmt = new Intl.DateTimeFormat("ro-RO", {
  timeZone: APP_TZ,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const plural = new Intl.PluralRules("ro");

/** One line for a mail subject or a list item: no control characters, no runs of space. */
export function oneLine(text: string, max = 200): string {
  // eslint-disable-next-line no-control-regex
  const flat = text.replace(/[\u0000-\u001f\u007f\s]+/g, " ").trim();
  return flat.length <= max ? flat : `${flat.slice(0, max - 1).trimEnd()}…`;
}

const sameBucharestDay = (a: Date, b: Date) => {
  const x = zonedParts(a);
  const y = zonedParts(b);
  return x.year === y.year && x.month === y.month && x.day === y.day;
};

interface Listed {
  title: string;
  startDate: string;
}

/** The inbox's wording, in Romanian: "3 evenimente noi la Muzeul de Artă". */
export function newEventsMail(placeName: string, events: Listed[], link: string) {
  const n = events.length;
  const form = plural.select(n);
  const headline =
    form === "one"
      ? `${n} eveniment nou la ${placeName}`
      : form === "few"
        ? `${n} evenimente noi la ${placeName}`
        : `${n} de evenimente noi la ${placeName}`;
  const lines = events.slice(0, MAX_LISTED).map((e) => {
    const at = new Date(e.startDate);
    return `- ${oneLine(e.title, 300)}, ${dayFmt.format(at)}, ${clockFmt.format(at)}`;
  });
  if (n > MAX_LISTED) lines.push(`- și încă ${n - MAX_LISTED}`);
  return {
    mailSubject: oneLine(headline),
    text: `${oneLine(headline, 1000)}:\n\n${lines.join("\n")}\n\nVezi locul: ${link}\n`,
  };
}

/** "Mâine: {title}, la {place}", or "Azi" when a retried mail goes out on the day itself. */
export function reminderMail(title: string, placeName: string, startDate: string, link: string, now: Date) {
  const at = new Date(startDate);
  const day = sameBucharestDay(at, now) ? "Azi" : "Mâine";
  const headline = `${day}: ${oneLine(title, 300)}, la ${placeName}`;
  return {
    mailSubject: oneLine(headline),
    text: `${oneLine(headline, 1000)}.\nÎncepe ${dayFmt.format(at)}, la ${clockFmt.format(at)}.\n\nVezi locul: ${link}\n`,
  };
}

type Row = {
  id: string;
  subject: string;
  kind: string;
  eventId: string | null;
  placeId: string | null;
  placeName: string | null;
  placeRetiredAt: string | null;
};

/** The mail for one row, or null when its news is past (or its place is gone). */
function compose(db: DB, row: Row, now: Date, base: string): Omit<NotificationInput, "subject"> | null {
  if (!row.placeId || !row.placeName || row.placeRetiredAt) return null;
  const link = `${base}/places/${row.placeId}`;
  const nowIso = now.toISOString();

  if (row.kind === "reminder") {
    if (!row.eventId) return null;
    const e = db
      .select({ title: event.title, startDate: event.startDate, status: event.status })
      .from(event)
      .where(eq(event.id, row.eventId))
      .get();
    if (!e || e.status !== "live" || e.startDate <= nowIso) return null;
    return reminderMail(e.title, row.placeName, e.startDate, link, now);
  }

  const events = db
    .select({ title: event.title, startDate: event.startDate })
    .from(notificationEvent)
    .innerJoin(event, eq(event.id, notificationEvent.eventId))
    .where(
      and(
        eq(notificationEvent.notificationId, row.id),
        eq(event.status, "live"),
        gte(sql`coalesce(${event.endDate}, ${event.startDate})`, nowIso),
      ),
    )
    .orderBy(asc(event.startDate))
    .all();
  if (events.length === 0) return null;
  return newEventsMail(row.placeName, events, link);
}

export interface MailSweepResult {
  sent: number;
  /** Ward answered `{ sent: false }`; final. */
  refused: number;
  /** Already past, or the place is gone: marked, not mailed. */
  skipped: number;
  /** Ward could not be asked; the rest wait for the next sweep. */
  deferred: boolean;
}

export async function runMailSweep(
  db: DB,
  send: SendNotification,
  now: Date,
  log: MailLog,
  base: string = appUrl(),
): Promise<MailSweepResult> {
  const result: MailSweepResult = { sent: 0, refused: 0, skipped: 0, deferred: false };
  const rows: Row[] = db
    .select({
      id: notification.id,
      subject: notification.subject,
      kind: notification.kind,
      eventId: notification.eventId,
      placeId: notification.placeId,
      placeName: place.name,
      placeRetiredAt: place.retiredAt,
    })
    .from(notification)
    .leftJoin(place, eq(place.id, notification.placeId))
    .where(isNull(notification.emailedAt))
    .orderBy(asc(notification.createdAt), asc(notification.id))
    .limit(MAIL_BATCH)
    .all();

  // Marked one row at a time, right after Ward answers, so a crash mid-sweep
  // can repeat at most the one mail in flight.
  const mark = (id: string) =>
    db.update(notification).set({ emailedAt: now.toISOString() }).where(eq(notification.id, id)).run();

  for (const row of rows) {
    const mail = compose(db, row, now, base);
    if (!mail) {
      mark(row.id);
      result.skipped++;
      continue;
    }
    let answer: NotificationResult;
    try {
      answer = await send({ subject: row.subject, ...mail });
    } catch (err) {
      // `WardConfigurationError` (prm's key refused) is a `WardUnavailableError`
      // too, and is treated the same: nothing is marked, so fixing the key or
      // Ward coming back resumes sending on the next sweep.
      if (err instanceof WardUnavailableError) {
        log.error({ err }, "notification mail: Ward cannot be asked; unsent rows wait for the next sweep");
        result.deferred = true;
        return result;
      }
      throw err;
    }
    mark(row.id);
    if (answer.sent) result.sent++;
    else result.refused++;
  }
  return result;
}

export interface MailSweeper {
  /** Run a sweep soon, in the background. A kick during a run queues one more. */
  kick(): void;
  /** Resolves once no sweep is running. */
  idle(): Promise<void>;
}

/**
 * The one runner for the sweep, so two never overlap and mail a row twice.
 * Kicked after an accept that wrote inbox rows and after the 09:00 reminder
 * sweep; never awaited by a request (`setImmediate`, after the response).
 */
export function createMailSweeper(
  db: DB,
  send: SendNotification,
  log: MailLog,
  clock: () => Date = () => new Date(),
): MailSweeper {
  let running: Promise<void> | null = null;
  let again = false;

  const loop = async () => {
    do {
      again = false;
      try {
        const r = await runMailSweep(db, send, clock(), log);
        if (r.sent || r.refused || r.skipped) {
          log.info(`notification mail: ${r.sent} sent, ${r.refused} refused by Ward, ${r.skipped} out of date`);
        }
      } catch (err) {
        log.error({ err }, "notification mail sweep failed");
      }
    } while (again);
  };

  return {
    kick() {
      if (running) {
        again = true;
        return;
      }
      running = new Promise<void>((resolve) => setImmediate(resolve))
        .then(loop)
        .finally(() => {
          running = null;
        });
    },
    idle: () => running ?? Promise.resolve(),
  };
}
