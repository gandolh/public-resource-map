// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * Ward sends a failed re-authentication back to settings as `?ward_error=`. The library's client reads
 * the address once, when it is created, so the address is set before anything is imported.
 */
vi.hoisted(() => {
  window.history.replaceState(null, "", "/settings?ward_error=ward_account_mismatch");
});

import { I18nProvider } from "~/lib/i18n";
import { WardLink } from "./WardLink";

let root: Root | null = null;
let host: HTMLElement | null = null;

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  localStorage.clear();
});

describe("WardLink after a refused Ward round trip", () => {
  it("a Ward-only user sees why, in English and in Romanian", async () => {
    for (const [lang, message] of [
      ["en", "Ward confirmed a different account from the one linked."],
      ["ro", "Ward a confirmat alt cont decât cel legat."],
    ] as const) {
      localStorage.setItem("civicmap-lang", lang);
      host = document.createElement("div");
      document.body.append(host);
      root = createRoot(host);
      await act(async () => {
        root?.render(
          <I18nProvider>
            <WardLink enabled linked hasPassword={false} />
          </I18nProvider>,
        );
      });
      expect(host.querySelector('[role="alert"]')?.textContent, lang).toBe(message);
      act(() => root?.unmount());
      host.remove();
    }
  });
});
