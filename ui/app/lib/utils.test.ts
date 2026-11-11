import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("lets a later colour win over an earlier one", () => {
    expect(cn("text-fg-muted", "text-accent")).toBe("text-accent");
  });

  it("keeps a named size beside a colour, and lets a later size win", () => {
    expect(cn("text-meta", "text-fg")).toBe("text-meta text-fg");
    expect(cn("text-meta leading-snug", "text-control")).toBe("leading-snug text-control");
  });

  it("knows the z scale, the shadows and the easing", () => {
    expect(cn("z-chrome", "z-sheet")).toBe("z-sheet");
    expect(cn("shadow-e1", "shadow-e3")).toBe("shadow-e3");
    expect(cn("ease-out-fast", "ease-in")).toBe("ease-in");
    expect(cn("shadow-e1", "shadow-accent")).toBe("shadow-e1 shadow-accent");
  });
});
