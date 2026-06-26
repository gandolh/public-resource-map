import { Moon, Sun } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { DropdownMenu, DropdownMenuItem } from "~/components/ui/DropdownMenu";
import { useTheme } from "~/components/ThemeProvider";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  const trigger = (
    <Button variant="ghost" size="icon" aria-label="Toggle theme">
      {theme === "dark" ? (
        <Moon size={18} className="text-cm-on-surface-variant" />
      ) : (
        <Sun size={18} className="text-cm-on-surface-variant" />
      )}
    </Button>
  );

  return (
    <DropdownMenu trigger={trigger} align="end">
      <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
      <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
      <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
    </DropdownMenu>
  );
}
