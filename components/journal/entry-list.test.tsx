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
  onSelectEntry = vi.fn(),
}: {
  hasMoreEntries?: boolean;
  loadingMoreEntries?: boolean;
  loadMoreEntries?: () => void;
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
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
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

    expect(container.querySelectorAll("ul > li")).toHaveLength(2);
    expect(getButton("Open First entry").getAttribute("aria-current")).toBe("true");

    await act(async () => getButton("Open Second entry").click());
    expect(onSelectEntry).toHaveBeenCalledWith(secondEntry.id);
  });

  it("filters loaded entries and explains an empty result", async () => {
    await act(async () => renderEntryList());
    const search = container.querySelector<HTMLInputElement>(
      "input[aria-label='Search entry titles']",
    );
    if (!search) throw new Error("Missing entry search field");

    await act(async () => {
      changeSearch(search, "second");
    });
    expect(container.querySelectorAll("ul > li")).toHaveLength(1);
    expect(container.querySelector("output")?.textContent).toBe("1 entry");

    await act(async () => {
      changeSearch(search, "missing");
    });
    expect(container.querySelectorAll("ul > li")).toHaveLength(0);
    expect(container.textContent).toContain("No matching entries");
    expect(container.textContent).toContain("Try a different entry title.");
  });

  it("keeps pagination available when the loaded entries do not match", async () => {
    const loadMoreEntries = vi.fn();
    await act(async () => renderEntryList({ hasMoreEntries: true, loadMoreEntries }));
    const search = container.querySelector<HTMLInputElement>(
      "input[aria-label='Search entry titles']",
    );
    if (!search) throw new Error("Missing entry search field");

    await act(async () => {
      changeSearch(search, "missing");
    });
    expect(container.textContent).toContain("No match in the loaded entries yet.");

    await act(async () => getButton("Load more").click());
    expect(loadMoreEntries).toHaveBeenCalledOnce();
  });
});
