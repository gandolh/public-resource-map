import { Outlet } from "react-router";
import { Navbar } from "./Navbar";
import { ThemeProvider } from "./ThemeProvider";

export function Layout() {
  return (
    <ThemeProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </ThemeProvider>
  );
}
