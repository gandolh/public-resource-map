import type { InputHTMLAttributes, ReactNode } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { AuthError } from "../../../vendor/ward/ward-auth-react.js";
import { authErrorKey } from "~/lib/authApi";
import { useI18n } from "~/lib/i18n";
import { cn } from "~/lib/utils";

/**
 * The pieces prm's login, register and settings pages share. prm's look, not
 * Ward's: the same field and notice shapes as the admin forms.
 */

export const inputClass =
  "h-10 w-full rounded-lg border border-line bg-surface px-3 text-[14px] text-fg outline-none transition-colors placeholder:text-fg-faint focus:border-accent";

export function Field({
  label,
  hint,
  ...input
}: { label: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block text-[13px] font-medium text-fg">
      {label}
      <input {...input} className={cn(inputClass, "mt-1.5")} />
      {hint && <span className="mt-1 block text-[12px] font-normal text-fg-muted">{hint}</span>}
    </label>
  );
}

/** A line of feedback: a problem (`role="alert"`) or a done thing (`role="status"`). */
export function Notice({ tone = "danger", children }: { tone?: "danger" | "ok" | "neutral"; children: ReactNode }) {
  const Icon = tone === "ok" ? CheckCircle2 : AlertCircle;
  return (
    <p
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-lg px-3 py-2 text-[13px] leading-snug",
        tone === "danger" && "bg-danger-weak text-danger",
        tone === "ok" && "border border-line bg-surface-2 text-fg",
        tone === "neutral" && "border border-line bg-surface-2 text-fg-muted",
      )}
    >
      {tone !== "neutral" && <Icon size={15} strokeWidth={2.2} className="mt-px shrink-0" aria-hidden="true" />}
      <span>{children}</span>
    </p>
  );
}

/** The message for a library error code, in prm's words. */
export function AuthErrorNotice({ error }: { error: AuthError | null | undefined }) {
  const { t } = useI18n();
  const key = authErrorKey(error);
  if (!key) return null;
  return <Notice>{t(key, { seconds: error?.retryAfterSeconds ?? 60 })}</Notice>;
}

/** The narrow column the login and register pages sit in. */
export function AuthPage({ title, lead, children }: { title: string; lead?: string; children: ReactNode }) {
  return (
    <div className="h-full overflow-y-auto pb-20 md:pb-8">
      <div className="mx-auto w-full max-w-[400px] px-4 py-8 md:py-14">
        <h1 className="text-[26px] leading-[1.15] font-semibold tracking-[-0.025em]">{title}</h1>
        {lead && <p className="mt-2 text-[14.5px] leading-relaxed text-fg-muted">{lead}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
