/**
 * Dev mailer — the auth verify/reset flows are built now, but email delivery is
 * console-logged links until a transactional provider (Resend/Postmark/SES) is
 * swapped in before launch (see decisions.md → Auth). Notifications (brief 05)
 * reuse this same infra.
 */
const APP_URL = process.env.APP_URL ?? "http://localhost:5173";

function log(subject: string, to: string, body: string): void {
  // eslint-disable-next-line no-console
  console.log(
    `\n[mailer:dev] To: ${to}\n[mailer:dev] Subject: ${subject}\n[mailer:dev] ${body}\n`,
  );
}

export function sendVerificationEmail(to: string, token: string): void {
  const link = `${APP_URL}/verify?token=${token}`;
  log("Verify your email", to, `Verify your account: ${link}`);
}

export function sendPasswordResetEmail(to: string, token: string): void {
  const link = `${APP_URL}/reset?token=${token}`;
  log("Reset your password", to, `Reset your password: ${link}`);
}
