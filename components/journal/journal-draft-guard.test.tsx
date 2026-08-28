// @vitest-environment jsdom

import { Theme } from "@radix-ui/themes";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { JournalDraftGuard } from "@/components/journal/journal-draft-guard";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));

function draftGuard(dirty: boolean, open = false, onDiscard = vi.fn()) {
  return (
    <Theme>
      <JournalDraftGuard dirty={dirty} open={open} onCancel={vi.fn()} onDiscard={onDiscard} />
    </Theme>
  );
}

describe("JournalDraftGuard", () => {
  it("protects hard navigation only while dirty", async () => {
    const view = render(draftGuard(true));
    const blocked = new Event("beforeunload", { cancelable: true });
    expect(window.dispatchEvent(blocked)).toBe(false);

    view.rerender(draftGuard(false));
    const allowed = new Event("beforeunload", { cancelable: true });
    expect(window.dispatchEvent(allowed)).toBe(true);
  });

  it("continues a protected in-app action only after discard", async () => {
    const user = userEvent.setup();
    const onDiscard = vi.fn();
    render(draftGuard(true, true, onDiscard));

    expect(screen.getByRole("alertdialog", { name: "title" })).toBeDefined();
    await user.click(screen.getByRole("button", { name: "discard" }));

    expect(onDiscard).toHaveBeenCalledOnce();
  });
});
