import { Outlet } from "react-router";
import { Navbar } from "./Navbar";
import { ThemeProvider } from "./ThemeProvider";

export default function Layout() {
  return (
    <ThemeProvider>
      <div className="flex flex-col min-h-screen bg-cm-background text-cm-on-background">
        <Navbar />
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </ThemeProvider>
  );
}
