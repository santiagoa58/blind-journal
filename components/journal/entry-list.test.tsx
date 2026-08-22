// @vitest-environment jsdom

import { Theme } from "@radix-ui/themes";
import { NextIntlClientProvider } from "next-intl";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

let container: HTMLDivElement;
let root: Root;

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
  root.render(
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

function getButton(name: string) {
  const button = Array.from(container.querySelectorAll("button")).find(
    (candidate) => candidate.getAttribute("aria-label") === name || candidate.textContent === name,
  );
  if (!button) throw new Error(`Missing ${name} button`);
  return button;
}

function changeSearch(search: HTMLInputElement, value: string) {
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  if (!setValue) throw new Error("Missing native input value setter");
  setValue.call(search, value);
  search.dispatchEvent(new Event("input", { bubbles: true }));
}

beforeEach(() => {
  Object.assign(globalThis, {
    IS_REACT_ACT_ENVIRONMENT: true,
    ResizeObserver: class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

describe("EntryList", () => {
  it("renders semantic entry options and reports the selected entry", async () => {
    const onSelectEntry = vi.fn();
    await act(async () => renderEntryList({ onSelectEntry }));

    expect(container.querySelector("[role='radiogroup']")?.getAttribute("aria-label")).toBe(
      "Journal entries",
    );
    expect(container.querySelectorAll("[role='radio']")).toHaveLength(2);
    const firstEntryButton = getButton("Open First entry");
    const secondEntryButton = getButton("Open Second entry");
    expect(firstEntryButton.getAttribute("aria-checked")).toBe("true");
    expect(firstEntryButton.dataset["state"]).toBe("checked");
    expect(secondEntryButton.getAttribute("aria-checked")).toBe("false");
    expect(secondEntryButton.dataset["state"]).toBe("unchecked");

    await act(async () => secondEntryButton.click());
    expect(onSelectEntry).toHaveBeenCalledWith(secondEntry.id);
  });

  it("filters loaded entries and explains an empty result", async () => {
    await act(async () => renderEntryList());
    const search = container.querySelector<HTMLInputElement>(
      "input[aria-label='Search loaded entry titles']",
    );
    if (!search) throw new Error("Missing entry search field");

    await act(async () => {
      changeSearch(search, "second");
    });
    expect(container.querySelectorAll("[role='radio']")).toHaveLength(1);
    expect(container.querySelector("output")?.textContent).toBe("1 entry");

    await act(async () => {
      changeSearch(search, "missing");
    });
    expect(container.querySelectorAll("[role='radio']")).toHaveLength(0);
    expect(container.textContent).toContain("No matching entries");
    expect(container.textContent).toContain("Try a different entry title.");
  });

  it("keeps pagination available when the loaded entries do not match", async () => {
    const loadMoreEntries = vi.fn();
    await act(async () => renderEntryList({ hasMoreEntries: true, loadMoreEntries }));
    const search = container.querySelector<HTMLInputElement>(
      "input[aria-label='Search loaded entry titles']",
    );
    if (!search) throw new Error("Missing entry search field");

    await act(async () => {
      changeSearch(search, "missing");
    });
    expect(container.textContent).toContain("No match in the loaded entries yet.");

    await act(async () => getButton("Load more").click());
    expect(loadMoreEntries).toHaveBeenCalledOnce();
  });

  it("offers deletion from an entry context menu", async () => {
    const onDeleteEntry = vi.fn();
    await act(async () => renderEntryList({ onDeleteEntry }));

    await act(async () => {
      getButton("Open Second entry").dispatchEvent(
        new MouseEvent("contextmenu", { bubbles: true, clientX: 20, clientY: 20 }),
      );
    });

    const deleteItem = document.querySelector<HTMLElement>("[role='menuitem']");
    if (!deleteItem) throw new Error("Missing context-menu delete item");
    expect(deleteItem.textContent).toContain("Delete entry");

    await act(async () => deleteItem.click());
    expect(onDeleteEntry).toHaveBeenCalledWith(secondEntry);
  });
});
