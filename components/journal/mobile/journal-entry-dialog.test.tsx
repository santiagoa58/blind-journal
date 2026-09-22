// @vitest-environment jsdom

import { Theme } from "@radix-ui/themes";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { JournalEntry } from "@/lib/api/journal/journal.type";
import entryListMessages from "@/messages/en/entry-list.json";
import { JournalEntryDialog } from "./journal-entry-dialog";

const longTitle = "An unusually long journal title ".repeat(4).slice(0, 120);
const entry = {
  id: "entry-one",
  title: longTitle,
  content: "<p>Entry body</p>",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
} satisfies JournalEntry;

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

function renderDialog(
  onSelectEntry = vi.fn(),
  loadMoreEntries = vi.fn(),
  hasMoreEntries = false,
  selectedEntryId?: string,
) {
  return render(
    <NextIntlClientProvider
      locale="en"
      messages={{ "entry-list": entryListMessages }}
      timeZone="UTC"
    >
      <Theme>
        <JournalEntryDialog
          entries={[entry]}
          selectedEntryId={selectedEntryId}
          hasMoreEntries={hasMoreEntries}
          loadingMoreEntries={false}
          loadMoreEntries={loadMoreEntries}
          onDeleteEntry={vi.fn()}
          onSelectEntry={onSelectEntry}
        />
      </Theme>
    </NextIntlClientProvider>,
  );
}

describe("mobile journal entry dialog", () => {
  it("shows the complete title and selects an entry from a dialog", async () => {
    const user = userEvent.setup();
    const onSelectEntry = vi.fn();
    renderDialog(onSelectEntry, vi.fn(), false, undefined);

    await user.click(screen.getByRole("button", { name: "Your entries" }));
    const dialog = screen.getByRole("dialog", { name: "Your entries" });
    expect(within(dialog).getByText(longTitle)).toBeInTheDocument();
    const option = within(dialog).getByRole("radio", { name: `Open ${longTitle}` });
    await user.click(option);
    expect(onSelectEntry).toHaveBeenCalledExactlyOnceWith(entry.id);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps pagination available inside the dialog", async () => {
    const user = userEvent.setup();
    const loadMoreEntries = vi.fn();
    renderDialog(vi.fn(), loadMoreEntries, true);

    await user.click(screen.getByRole("button", { name: "Your entries" }));
    await user.click(screen.getByRole("button", { name: "Load more" }));
    expect(loadMoreEntries).toHaveBeenCalledOnce();
  });
});
