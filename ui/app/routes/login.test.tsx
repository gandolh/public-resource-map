// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * A refused Ward sign-in lands on the login page as `?ward_error=…&ward_return_to=…` with no `next`.
 * The library reads the address once, when its client is created, so it is set before the imports.
 */
vi.hoisted(() => {
  window.history.replaceState(null, "", "/login?ward_error=access_denied&ward_return_to=/place/abc");
});

import { I18nProvider } from "~/lib/i18n";
import { authClient } from "~/lib/authApi";
import LoginRoute from "./login";

let root: Root | null = null;
let host: HTMLElement | null = null;
const requests: { url: string; body: unknown }[] = [];

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  requests.length = 0;
  vi.unstubAllGlobals();
});

function stubServer(session: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const u = String(url);
      requests.push({ url: u, body: init?.body ? JSON.parse(String(init.body)) : undefined });
      const body = u.endsWith("/session") ? session : { url: "https://ward.test/auth" };
      return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
    }),
  );
}

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>;
}

async function show() {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => {
    root?.render(
      <I18nProvider>
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route path="/login" element={<LoginRoute />} />
            <Route path="*" element={<Where />} />
          </Routes>
        </MemoryRouter>
      </I18nProvider>,
    );
  });
  await act(async () => {
    await authClient.refresh();
  });
}

describe("login after a refused Ward sign-in", () => {
  it("Try again with Ward starts it for the place the person was heading", async () => {
    stubServer({ user: null, session: null, ward: { enabled: true, linked: false } });
    await show();
    const button = [...(host?.querySelectorAll("button") ?? [])].find((b) => b.type === "button");
    if (!button) throw new Error("no Ward button");
    await act(async () => {
      button.click();
    });
    expect(requests.find((r) => r.url.endsWith("/ward/start"))?.body).toEqual({ returnTo: "/place/abc" });
  });

  it("signing in another way goes there too", async () => {
    stubServer({
      user: { id: "u", username: "dan", role: "user", hasPassword: true },
      session: { origin: "local" },
      ward: { enabled: true, linked: false },
    });
    await show();
    expect(host?.querySelector('[data-testid="where"]')?.textContent).toBe("/place/abc");
  });
});
