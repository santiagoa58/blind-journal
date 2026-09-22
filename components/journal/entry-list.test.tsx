// @vitest-environment jsdom

import { Theme } from "@radix-ui/themes";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EntryList } from "@/components/journal/entry-list";
import type { JournalEntry } from "@/lib/api/journal/journal.type";
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
  entries = [firstEntry, secondEntry],
  hasMoreEntries = false,
  loadingMoreEntries = false,
  loadMoreEntries = vi.fn(),
  onDeleteEntry = vi.fn(),
  onSelectEntry = vi.fn(),
}: {
  entries?: JournalEntry[];
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
          entries={entries}
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
  it("renders entry navigation and reports the current entry", async () => {
    const user = userEvent.setup();
    const onSelectEntry = vi.fn();
    renderEntryList({ onSelectEntry });

    expect(screen.getByRole("region", { name: "Journal entries" })).toBeInTheDocument();
    const firstEntryButton = screen.getByRole("button", { name: "Open First entry" });
    const secondEntryButton = screen.getByRole("button", { name: "Open Second entry" });
    expect(firstEntryButton).toHaveAttribute("aria-current", "page");
    expect(secondEntryButton).not.toHaveAttribute("aria-current");

    await user.click(secondEntryButton);
    expect(onSelectEntry).toHaveBeenCalledWith(secondEntry.id);
  });

  it("filters loaded entries and explains an empty result", async () => {
    const user = userEvent.setup();
    renderEntryList();
    const search = screen.getByRole<HTMLInputElement>("searchbox", {
      name: "Search journal entries by title",
    });
    expect(search).toHaveAttribute("placeholder", "Search by title");

    await user.type(search, "second");
    expect(screen.getAllByRole("button", { name: /^Open / })).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent("1 entry");

    await user.clear(search);
    await user.type(search, "missing");
    expect(screen.queryAllByRole("button", { name: /^Open / })).toHaveLength(0);
    expect(screen.getByText("No matching entries")).toBeInTheDocument();
    expect(screen.getByText("Try a different entry title.")).toBeInTheDocument();
  });

  it("keeps pagination available when the loaded entries do not match", async () => {
    const user = userEvent.setup();
    const loadMoreEntries = vi.fn();
    renderEntryList({ hasMoreEntries: true, loadMoreEntries });
    const search = screen.getByRole("searchbox", {
      name: "Search loaded journal entries by title",
    });
    expect(search).toHaveAttribute("placeholder", "Search loaded titles");

    await user.type(search, "missing");
    expect(screen.getByText(/No match in the loaded entries yet\./)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Load more" }));
    expect(loadMoreEntries).toHaveBeenCalledOnce();
  });

  it("does not show a no-results panel in an untouched empty journal", async () => {
    const user = userEvent.setup();
    renderEntryList({ entries: [] });

    expect(screen.queryByText("No matching entries")).not.toBeInTheDocument();
    const search = screen.getByRole("searchbox", { name: "Search journal entries by title" });
    await user.type(search, "missing");
    expect(screen.getByText("No matching entries")).toBeInTheDocument();
  });

  it("offers deletion from an entry context menu", async () => {
    const user = userEvent.setup();
    const onDeleteEntry = vi.fn();
    renderEntryList({ onDeleteEntry });

    await user.pointer({
      keys: "[MouseRight]",
      target: screen.getByRole("button", { name: "Open Second entry" }),
    });

    const deleteItem = await screen.findByRole("menuitem", { name: "Delete entry" });

    await user.click(deleteItem);
    expect(onDeleteEntry).toHaveBeenCalledWith(secondEntry);
  });
});
