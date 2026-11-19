// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "~/lib/i18n";
import { ChangeUsername } from "./ChangeUsername";

let root: Root | null = null;
let host: HTMLElement | null = null;
const fetchMock = vi.fn();

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  localStorage.clear();
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

async function submitSameName(lang: "ro" | "en") {
  localStorage.setItem("civicmap-lang", lang);
  vi.stubGlobal("fetch", fetchMock);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => {
    root?.render(
      <I18nProvider>
        <ChangeUsername username="dan" />
      </I18nProvider>,
    );
  });
  await act(async () => {
    host?.querySelector("form")?.requestSubmit();
  });
}

describe("ChangeUsername", () => {
  it.each([
    ["en", "That's already your username."],
    ["ro", "Acesta e deja numele tău."],
  ] as const)("sending the current name says so (%s) and asks nothing of the server", async (lang, message) => {
    await submitSameName(lang);
    expect(host?.querySelector('[role="status"]')?.textContent).toBe(message);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
