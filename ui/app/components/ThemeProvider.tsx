"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { LocalStorage } from "~/lib/LocalStorage";
import { applyTheme, isTheme, THEME_KEY, type Theme } from "~/lib/theme";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "light",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

/**
 * Light, Dark or System, kept on this device. A first visit is light, whatever the operating system
 * says; System follows the operating system and its changes. The resolved theme is `data-theme` on
 * <html>, which the stylesheet's tokens and its `dark:` variant read.
 */
export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = THEME_KEY,
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = LocalStorage.get<unknown>(storageKey);
    return isTheme(stored) ? stored : defaultTheme;
  });

  useEffect(() => {
    applyTheme(theme);
    if (theme !== "system") return;
    // System follows the operating system live.
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const follow = () => applyTheme("system");
    query.addEventListener("change", follow);
    return () => query.removeEventListener("change", follow);
  }, [theme]);

  const value = {
    theme,
    setTheme: (next: Theme) => {
      LocalStorage.set(storageKey, next);
      setTheme(next);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
