import type { ReactNode } from "react";
import { Outlet } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { Navbar } from "./Navbar";
import { NoticeToast } from "./shell/NoticeToast";
import { ThemeProvider } from "./ThemeProvider";
import { I18nProvider } from "~/lib/i18n";
import { queryClient } from "~/lib/queryClient";

/** Data, language and theme: what the public site and the admin shell share. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default function Layout() {
  return (
    <AppProviders>
      {/* `dvh` rather than `vh`: on mobile Safari a 100vh app shell hides its
          own bottom edge behind the browser chrome. */}
      <div className="flex h-[100dvh] flex-col overflow-hidden bg-bg text-fg">
        <Navbar />
        <main className="relative min-h-0 flex-1">
          <Outlet />
          <NoticeToast />
        </main>
      </div>
    </AppProviders>
  );
}
