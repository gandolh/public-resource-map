import type { ReactNode } from "react";

/** One titled block of the account settings page. */
export function SettingsSection({ title, lead, children }: { title: string; lead?: string; children?: ReactNode }) {
  return (
    <section className="mt-8 border-t border-line pt-6 first:mt-6 first:border-t-0 first:pt-0">
      <h2 className="text-title leading-snug font-semibold tracking-[-0.015em] text-fg">{title}</h2>
      {lead && <p className="mt-1.5 text-body leading-relaxed text-fg-muted">{lead}</p>}
      {children && <div className="mt-4 space-y-3">{children}</div>}
    </section>
  );
}
