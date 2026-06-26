import { Link, useLocation } from "react-router";
import { User } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { Avatar } from "~/components/ui/Avatar";
import { Button } from "~/components/ui/Button";
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from "~/components/ui/DropdownMenu";
import { cn } from "~/lib/utils";

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const { pathname } = useLocation();
  const active = pathname === to || pathname.startsWith(to + "/");
  return (
    <Link
      to={to}
      className={cn(
        "text-sm font-medium transition-colors duration-200 pb-0.5",
        active
          ? "text-cm-primary border-b-2 border-cm-primary opacity-80"
          : "text-cm-on-surface-variant hover:text-cm-primary",
      )}
    >
      {children}
    </Link>
  );
}

function ProfileMenu() {
  const trigger = (
    <Button variant="ghost" size="icon" aria-label="Profile">
      <Avatar fallback="U" />
    </Button>
  );

  return (
    <DropdownMenu trigger={trigger} align="end">
      <DropdownMenuLabel>My Account</DropdownMenuLabel>
      <DropdownMenuItem>Profile</DropdownMenuItem>
      <DropdownMenuItem>Settings</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem>Sign out</DropdownMenuItem>
    </DropdownMenu>
  );
}

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-10 h-16 bg-cm-surface border-b border-cm-outline-variant shadow-sm">
      <div className="flex items-center gap-6">
        <Link to="/map" className="text-xl font-bold text-cm-primary tracking-tight">
          CivicMap
        </Link>
        <div className="hidden md:flex items-center gap-5 ml-4">
          <NavLink to="/map">Map</NavLink>
          <NavLink to="/events">Events</NavLink>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <ProfileMenu />
      </div>
    </nav>
  );
}
