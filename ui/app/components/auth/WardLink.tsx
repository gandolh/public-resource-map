import { useRef, type FormEvent } from "react";
import { useWardLink, useWardUnlink, type AuthError } from "../../../vendor/ward/ward-auth-react.js";
import { Button } from "~/components/ui/Button";
import { useI18n } from "~/lib/i18n";
import { AuthErrorNotice, Field, Notice } from "./fields";
import { SettingsSection } from "./SettingsSection";

/**
 * Link or unlink a Ward account. Both ask for the account's local password again,
 * so a session left open on a shared screen can't tie the account to someone else's
 * Ward. A refusal stays on the page, beside the field, and the field keeps focus.
 */
export function WardLink({
  enabled,
  linked,
  hasPassword,
}: {
  enabled: boolean;
  linked: boolean;
  hasPassword: boolean;
}) {
  const { t } = useI18n();
  const link = useWardLink();
  const unlink = useWardUnlink();
  const field = useRef<HTMLInputElement>(null);

  if (!enabled) return <SettingsSection title={t("settings.wardTitle")} lead={t("settings.wardOff")} />;

  const error: AuthError | null = link.error ?? unlink.error ?? null;
  // The library's "invalid_credentials" reads "name or password"; here only the password is typed.
  const wrongPassword = error?.code === "invalid_credentials";

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const password = field.current?.value ?? "";
    const run = linked ? unlink.unlink(password) : link.link(password);
    void run.then((ok) => {
      if (!ok) field.current?.focus();
    });
  };

  return (
    <SettingsSection
      title={t("settings.wardTitle")}
      lead={t(linked ? "settings.wardLinkedLead" : "settings.wardUnlinkedLead")}
    >
      {link.linked && <Notice tone="ok">{t("settings.linked")}</Notice>}
      {unlink.done && <Notice tone="ok">{t("settings.unlinked")}</Notice>}
      {linked && !hasPassword ? (
        <>
          <Notice tone="neutral">{t("settings.unlinkNeedsPassword")}</Notice>
          <Button variant="secondary" disabled>
            {t("settings.unlink")}
          </Button>
        </>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field
            ref={field}
            label={t("settings.currentPassword")}
            name="wardPassword"
            type="password"
            autoComplete="current-password"
            hint={t(linked ? "settings.unlinkPasswordHint" : "settings.linkPasswordHint")}
            aria-invalid={error ? true : undefined}
            required
          />
          {wrongPassword ? <Notice>{t("settings.wrongPassword")}</Notice> : <AuthErrorNotice error={error} />}
          <Button type="submit" variant="secondary" disabled={link.pending || unlink.pending}>
            {t(linked ? "settings.unlink" : "settings.link")}
          </Button>
        </form>
      )}
    </SettingsSection>
  );
}
