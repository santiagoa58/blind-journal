// @vitest-environment jsdom

import { act, type ButtonHTMLAttributes, type PropsWithChildren } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JournalDraftGuard } from "@/components/journal/journal-draft-guard";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@radix-ui/themes", async () => {
  const React = await import("react");
  const Wrapper = ({ children }: PropsWithChildren) => React.createElement("div", null, children);
  const TestButton = (props: ButtonHTMLAttributes<HTMLButtonElement>) =>
    React.createElement("button", props);
  return {
    AlertDialog: {
      Root: ({ children, open }: PropsWithChildren<{ open: boolean }>) => (
        <div data-dialog-open={String(open)}>{children}</div>
      ),
      Cancel: Wrapper,
      Content: Wrapper,
      Description: Wrapper,
      Action: Wrapper,
      Title: Wrapper,
    },
    Button: TestButton,
    Flex: Wrapper,
  };
});

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

describe("JournalDraftGuard", () => {
  it("protects hard navigation only while dirty", async () => {
    const render = (dirty: boolean) =>
      root.render(
        <JournalDraftGuard dirty={dirty} open={false} onCancel={vi.fn()} onDiscard={vi.fn()} />,
      );
    await act(async () => render(true));
    const blocked = new Event("beforeunload", { cancelable: true });
    expect(window.dispatchEvent(blocked)).toBe(false);

    await act(async () => render(false));
    const allowed = new Event("beforeunload", { cancelable: true });
    expect(window.dispatchEvent(allowed)).toBe(true);
  });

  it("continues a protected in-app action only after discard", async () => {
    const onDiscard = vi.fn();
    await act(async () => {
      root.render(<JournalDraftGuard dirty open onCancel={vi.fn()} onDiscard={onDiscard} />);
    });

    expect(container.querySelector<HTMLElement>("[data-dialog-open]")?.dataset["dialogOpen"]).toBe(
      "true",
    );

    const discard = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "discard",
    );
    if (!discard) throw new Error("Missing discard button");
    await act(async () => discard.click());

    expect(onDiscard).toHaveBeenCalledOnce();
  });
});
