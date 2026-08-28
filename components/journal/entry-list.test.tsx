// @vitest-environment jsdom

import { Theme } from "@radix-ui/themes";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { JournalEntry } from "@/api/journal/journal.type";
import { EntryList } from "@/components/journal/entry-list";
import entryListMessages from "@/messages/en/entry-list.json";

const firstEntry = {
  id: "first-entry",
  title: "First entry",
  content: "<p>First</p>",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
} satisfies JournalEntry;
const secondEntry = {
  ...firstEntry,
  id: "second-entry",
  title: "Second entry",
  updatedAt: "2026-01-02T00:00:00.000Z",
} satisfies JournalEntry;

function renderEntryList({
  hasMoreEntries = false,
  loadingMoreEntries = false,
  loadMoreEntries = vi.fn(),
  onDeleteEntry = vi.fn(),
  onSelectEntry = vi.fn(),
}: {
  hasMoreEntries?: boolean;
  loadingMoreEntries?: boolean;
  loadMoreEntries?: () => void;
  onDeleteEntry?: (entry: JournalEntry) => void;
  onSelectEntry?: (entryId: string) => void;
} = {}) {
  return render(
    <NextIntlClientProvider
      locale="en"
      messages={{ "entry-list": entryListMessages }}
      timeZone="UTC"
    >
      <Theme>
        <EntryList
          entries={[firstEntry, secondEntry]}
          hasMoreEntries={hasMoreEntries}
          loadingMoreEntries={loadingMoreEntries}
          loadMoreEntries={loadMoreEntries}
          onDeleteEntry={onDeleteEntry}
          onSelectEntry={onSelectEntry}
          selectedEntryId={firstEntry.id}
        />
      </Theme>
    </NextIntlClientProvider>,
  );
}

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

describe("EntryList", () => {
  it("renders semantic entry options and reports the selected entry", async () => {
    const user = userEvent.setup();
    const onSelectEntry = vi.fn();
    renderEntryList({ onSelectEntry });

    expect(screen.getByRole("radiogroup", { name: "Journal entries" })).toBeDefined();
    expect(screen.getAllByRole("radio")).toHaveLength(2);
    const firstEntryButton = screen.getByRole("radio", { name: "Open First entry" });
    const secondEntryButton = screen.getByRole("radio", { name: "Open Second entry" });
    expect(firstEntryButton.getAttribute("aria-checked")).toBe("true");
    expect(secondEntryButton.getAttribute("aria-checked")).toBe("false");

    await user.click(secondEntryButton);
    expect(onSelectEntry).toHaveBeenCalledWith(secondEntry.id);
  });

  it("filters loaded entries and explains an empty result", async () => {
    const user = userEvent.setup();
    renderEntryList();
    const search = screen.getByRole<HTMLInputElement>("searchbox", {
      name: "Search journal entries by title",
    });
    expect(search.placeholder).toBe("Search by title");

    await user.type(search, "second");
    expect(screen.getAllByRole("radio")).toHaveLength(1);
    expect(screen.getByRole("status").textContent).toBe("1 entry");

    await user.clear(search);
    await user.type(search, "missing");
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
    expect(screen.getByText("No matching entries")).toBeDefined();
    expect(screen.getByText("Try a different entry title.")).toBeDefined();
  });

  it("keeps pagination available when the loaded entries do not match", async () => {
    const user = userEvent.setup();
    const loadMoreEntries = vi.fn();
    renderEntryList({ hasMoreEntries: true, loadMoreEntries });
    const search = screen.getByRole("searchbox", { name: "Search journal entries by title" });

    await user.type(search, "missing");
    expect(screen.getByText(/No match in the loaded entries yet\./)).toBeDefined();

    await user.click(screen.getByRole("button", { name: "Load more" }));
    expect(loadMoreEntries).toHaveBeenCalledOnce();
  });

  it("offers deletion from an entry context menu", async () => {
    const user = userEvent.setup();
    const onDeleteEntry = vi.fn();
    renderEntryList({ onDeleteEntry });

    fireEvent.contextMenu(screen.getByRole("radio", { name: "Open Second entry" }), {
      clientX: 20,
      clientY: 20,
    });

    const deleteItem = await screen.findByRole("menuitem", { name: "Delete entry" });

    await user.click(deleteItem);
    expect(onDeleteEntry).toHaveBeenCalledWith(secondEntry);
  });
});
