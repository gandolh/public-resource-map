import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { THEME_BOOT_SCRIPT, THEME_COLORS, THEME_KEY } from "./theme";

const css = readFileSync(new URL("../app.css", import.meta.url), "utf8");

/** Runs the boot script against a fake page and returns what it left behind. */
function boot({
  stored,
  systemDark = false,
  broken = false,
}: {
  stored?: string;
  systemDark?: boolean;
  broken?: boolean;
}) {
  const attrs: Record<string, string> = {};
  const root = { setAttribute: (name: string, value: string) => (attrs[name] = value) };
  const meta = { content: "", setAttribute: (_name: string, value: string) => (meta.content = value) };
  runInNewContext(THEME_BOOT_SCRIPT, {
    document: { documentElement: root, querySelector: () => meta },
    localStorage: {
      getItem: (key: string) => {
        if (broken) throw new Error("storage is blocked");
        return key === THEME_KEY ? (stored ?? null) : null;
      },
    },
    matchMedia: () => ({ matches: systemDark }),
  });
  return { theme: attrs["data-theme"], color: meta.content };
}

describe("the theme boot script", () => {
  it("shows light on a first visit, even when the system is dark", () => {
    expect(boot({ systemDark: true })).toEqual({ theme: "light", color: THEME_COLORS.light });
  });

  it("applies a stored choice", () => {
    expect(boot({ stored: "dark" })).toEqual({ theme: "dark", color: THEME_COLORS.dark });
    expect(boot({ stored: "light", systemDark: true }).theme).toBe("light");
  });

  it("follows the system for System, and reads a quoted value", () => {
    expect(boot({ stored: "system", systemDark: true }).theme).toBe("dark");
    expect(boot({ stored: "system" }).theme).toBe("light");
    expect(boot({ stored: '"dark"' }).theme).toBe("dark");
  });

  it("falls back to light when storage is blocked or holds nonsense", () => {
    expect(boot({ broken: true }).theme).toBe("light");
    expect(boot({ stored: "purple" }).theme).toBe("light");
  });
});

describe("the stylesheet and the theme", () => {
  /** The value of `--bg` inside the block that opens with `selector`. */
  const bg = (selector: string) => {
    const block = css.slice(css.indexOf(`\n${selector} {`));
    return /--bg:\s*(#[0-9a-f]{6})/i.exec(block)?.[1];
  };

  it("keeps the browser-bar colours equal to the page background in each theme", () => {
    expect(bg(":root")).toBe(THEME_COLORS.light);
    expect(bg(':root[data-theme="dark"]')).toBe(THEME_COLORS.dark);
  });

  it("keys dark mode off data-theme, not a class", () => {
    expect(css).toMatch(/@custom-variant dark \(&:where\(\[data-theme="dark"\]/);
    expect(css).not.toMatch(/\.dark(?![\w-])/);
    expect(css).not.toMatch(/prefers-color-scheme/);
  });
});
