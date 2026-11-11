// @vitest-environment jsdom
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { Dialog } from "./Dialog";

/** What the wrapper decides: where focus lands on open, and when Escape counts. Base UI's own behaviour isn't tested here. */

let root: Root | null = null;
let host: HTMLElement | null = null;

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

async function show(node: ReactNode) {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => {
    root?.render(node);
  });
  // Base UI moves focus after the popup has mounted.
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 60));
  });
}

async function press(label: string, key: string) {
  const target = document.querySelector(`input[aria-label="${label}"]`);
  if (!target) throw new Error(`no field named ${label}`);
  await act(async () => {
    target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
  });
}

describe("Dialog", () => {
  it("puts focus on the first field of the body, not on the X", async () => {
    await show(
      <Dialog open onOpenChange={() => {}} title="Rename" closeLabel="Close">
        <input aria-label="Name" />
        <button type="button">Other</button>
      </Dialog>,
    );
    expect(document.activeElement).toBe(document.querySelector('input[aria-label="Name"]'));
  });

  it("prefers an element marked data-autofocus", async () => {
    await show(
      <Dialog open onOpenChange={() => {}} title="Rename" closeLabel="Close">
        <input aria-label="First" />
        <input aria-label="Second" data-autofocus />
      </Dialog>,
    );
    expect(document.activeElement).toBe(document.querySelector('input[aria-label="Second"]'));
  });

  it("falls back to the footer's first button when the body has nothing to focus", async () => {
    await show(
      <Dialog
        open
        onOpenChange={() => {}}
        title="Done?"
        closeLabel="Close"
        footer={<button type="button">Accept</button>}
      >
        <p>Nothing to type here.</p>
      </Dialog>,
    );
    expect(document.activeElement?.textContent).toBe("Accept");
  });

  it("closes on Escape", async () => {
    const onOpenChange = vi.fn();
    await show(
      <Dialog open onOpenChange={onOpenChange} title="Rename" closeLabel="Close">
        <input aria-label="Name" />
      </Dialog>,
    );
    await press("Name", "Escape");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("ignores an Escape that a control inside already used", async () => {
    const onOpenChange = vi.fn();
    await show(
      <Dialog open onOpenChange={onOpenChange} title="Rename" closeLabel="Close">
        <input
          aria-label="Name"
          onKeyDown={(event) => {
            if (event.key === "Escape") event.preventDefault();
          }}
        />
      </Dialog>,
    );
    await press("Name", "Escape");
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("names the dialog by its title and the X by closeLabel", async () => {
    await show(
      <Dialog open onOpenChange={() => {}} title="Rename" closeLabel="Inchide">
        <input aria-label="Name" />
      </Dialog>,
    );
    const dialog = document.querySelector('[role="dialog"]');
    const titleId = dialog?.getAttribute("aria-labelledby");
    expect(titleId && document.getElementById(titleId)?.textContent).toBe("Rename");
    expect(document.querySelector('button[aria-label="Inchide"]')).not.toBeNull();
  });
});
