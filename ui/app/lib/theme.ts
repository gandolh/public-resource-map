/** The theme choice: kept on the device, light on a first visit (base-ui rule 14). */
export type Theme = "light" | "dark" | "system";
/** What the page is drawn in: `system` resolved against the operating system. */
export type ResolvedTheme = "light" | "dark";

/** Kept from the template this app grew from, so existing choices survive. */
export const THEME_KEY = "vite-ui-theme";

/**
 * The browser bar's colour per theme: the page background (`--bg` in app.css), so the bar
 * follows the switch. A test keeps these equal to the stylesheet's.
 */
export const THEME_COLORS: Record<ResolvedTheme, string> = { light: "#e8ecf1", dark: "#090b0f" };

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

export function prefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === "dark" || (theme === "system" && prefersDark()) ? "dark" : "light";
}

/** Puts the resolved theme on <html> as `data-theme`, and the matching colour on the theme-color meta. */
export function applyTheme(theme: Theme): ResolvedTheme {
  const resolved = resolveTheme(theme);
  document.documentElement.dataset.theme = resolved;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[resolved]);
  return resolved;
}

/**
 * Runs in <head> before the first paint, so a returning dark visitor never sees a light flash.
 * It does what `applyTheme` does, in ES5 and with no imports: it is written into the page.
 */
export const THEME_BOOT_SCRIPT = `(function(){var d=document.documentElement;try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});if(t&&t.charAt(0)==='"')t=JSON.parse(t);var dark=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);d.setAttribute("data-theme",dark?"dark":"light");var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",dark?${JSON.stringify(THEME_COLORS.dark)}:${JSON.stringify(THEME_COLORS.light)})}catch(e){d.setAttribute("data-theme","light")}})();`;
