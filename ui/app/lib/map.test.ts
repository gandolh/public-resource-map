import { describe, expect, it } from "vitest";
import { placeUrl } from "./map";

describe("placeUrl", () => {
  it("keeps the deployed base path", () => {
    expect(placeUrl("abc", "https://example.org", "/prm/")).toBe("https://example.org/prm/places/abc");
  });

  it("works at the root in dev", () => {
    expect(placeUrl(42, "http://localhost:5173", "/")).toBe("http://localhost:5173/places/42");
  });
});
