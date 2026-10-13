import { describe, expect, it } from "vitest";
import { authErrorKey, loginPath, safeNext } from "./authApi";

// Brief 24 (Ward's corpus): `?next=` comes from the address bar, so it must
// never send a person off prm or back into the login page. Vitest serves the
// app at "/", so these run with an empty base.
describe("safeNext", () => {
  it("keeps a path inside the app", () => {
    expect(safeNext("/whats-on?x=1")).toEqual({ browser: "/whats-on?x=1", router: "/whats-on?x=1" });
  });

  it("refuses anything that leaves the origin", () => {
    for (const next of ["https://example.com/", "//example.com/", "/\\example.com", "javascript:alert(1)", ""]) {
      expect(safeNext(next), next).toEqual({ browser: "/", router: "/" });
    }
  });

  it("does not come back to the login or register page", () => {
    expect(safeNext("/login?next=/x").router).toBe("/");
    expect(safeNext("/register").router).toBe("/");
  });

  it("is home when there is none", () => {
    expect(safeNext(null).router).toBe("/");
  });
});

describe("loginPath", () => {
  it("carries next encoded", () => {
    expect(loginPath("/places/1?favorite=place:1")).toBe("/login?next=%2Fplaces%2F1%3Ffavorite%3Dplace%3A1");
  });
});

describe("authErrorKey", () => {
  it("maps a known code and falls back for an unknown one", () => {
    expect(authErrorKey({ code: "access_denied" })).toBe("authError.access_denied");
    expect(authErrorKey({ code: "temporarily_unavailable" })).toBe("authError.unknown");
    expect(authErrorKey(null)).toBeNull();
  });
});
