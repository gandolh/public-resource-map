import { Outlet } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { Navbar } from "./Navbar";
import { ThemeProvider } from "./ThemeProvider";
import { I18nProvider } from "~/lib/i18n";
import { queryClient } from "~/lib/queryClient";

export default function Layout() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <ThemeProvider>
          {/* `dvh` rather than `vh`: on mobile Safari a 100vh app shell hides its
              own bottom edge behind the browser chrome. */}
          <div className="flex h-[100dvh] flex-col overflow-hidden bg-bg text-fg">
            <Navbar />
            <main className="relative min-h-0 flex-1">
              <Outlet />
            </main>
          </div>
        </ThemeProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
