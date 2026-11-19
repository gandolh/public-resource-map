// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "~/lib/i18n";
import { WardLink } from "./WardLink";

/**
 * What the Ward section decides: it sends the typed password, and a refusal stays beside the
 * field with focus back on it. The hooks are the library's own, over a stubbed `fetch`.
 */

let root: Root | null = null;
let host: HTMLElement | null = null;
const calls: { url: string; body: unknown }[] = [];

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  calls.length = 0;
  localStorage.clear();
  vi.unstubAllGlobals();
});

function stubServer(status: number, body: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url: String(url), body: init?.body ? JSON.parse(String(init.body)) : undefined });
      return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
    }),
  );
}

async function show(props: { linked: boolean; hasPassword?: boolean }) {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => {
    root?.render(
      <I18nProvider>
        <WardLink enabled linked={props.linked} hasPassword={props.hasPassword ?? true} />
      </I18nProvider>,
    );
  });
}

async function submitWith(password: string) {
  const input = host?.querySelector<HTMLInputElement>('input[type="password"]');
  if (!input) throw new Error("no password field");
  await act(async () => {
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    set?.call(input, password);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () => {
    host?.querySelector("form")?.requestSubmit();
  });
  return input;
}

describe("WardLink", () => {
  it("link sends the typed password", async () => {
    stubServer(200, { url: "https://ward.test/auth" });
    // jsdom can't navigate; the library assigns window.location after a good answer.
    await show({ linked: false });
    await submitWith("hunter2-hunter2").catch(() => undefined);
    expect(calls.at(-1)).toMatchObject({
      url: expect.stringContaining("/ward/link"),
      body: { currentPassword: "hunter2-hunter2" },
    });
  });

  it.each([
    ["ro", "Parola nu e cea bună."],
    ["en", "That isn't your password."],
  ])("a wrong password shows its message (%s) beside the field and focus stays there", async (lang, message) => {
    localStorage.setItem("civicmap-lang", lang);
    stubServer(401, { error: "invalid_credentials" });
    await show({ linked: true });
    const input = await submitWith("not the password");
    expect(calls.at(-1)).toMatchObject({
      url: expect.stringContaining("/ward/unlink"),
      body: { currentPassword: "not the password" },
    });
    expect(host?.querySelector('[role="alert"]')?.textContent).toBe(message);
    expect(document.activeElement).toBe(input);
  });

  it("too many attempts shows the wait", async () => {
    stubServer(429, { error: "too_many_attempts", retryAfterSeconds: 42 });
    await show({ linked: true });
    await submitWith("x");
    expect(host?.querySelector('[role="alert"]')?.textContent).toContain("42");
  });

  it("a Ward-only user gets the set-a-password notice and no password field", async () => {
    await show({ linked: true, hasPassword: false });
    expect(host?.querySelector('input[type="password"]')).toBeNull();
    expect(host?.querySelector("button")?.disabled).toBe(true);
    expect(host?.textContent).toContain("Pune întâi o parolă CivicMap, altfel după dezlegare n-ai mai putea intra.");
  });
});
