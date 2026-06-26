import { Outlet } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { Navbar } from "./Navbar";
import { ThemeProvider } from "./ThemeProvider";
import { queryClient } from "~/lib/queryClient";

export default function Layout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <div className="flex flex-col min-h-screen bg-cm-background text-cm-on-background">
          <Navbar />
          <div className="flex-1">
            <Outlet />
          </div>
        </div>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
