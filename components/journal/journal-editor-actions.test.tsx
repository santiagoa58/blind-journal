// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Editor } from "@tiptap/react";
import { act, type ButtonHTMLAttributes, type PropsWithChildren } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ClientUser } from "@/api/auth/user.type";
import type { JournalEntry } from "@/api/journal/journal.type";
import { JournalEditorActions } from "@/components/journal/journal-editor-actions";
import { journalEntriesQueryKey } from "@/components/journal/journal-query";

const mocks = vi.hoisted(() => ({
  createJournalEntry: vi.fn(),
  deleteJournalEntry: vi.fn(),
  updateJournalEntry: vi.fn(),
  success: vi.fn(),
}));

vi.mock("@/api/journal/journal", () => ({
  createJournalEntry: mocks.createJournalEntry,
  deleteJournalEntry: mocks.deleteJournalEntry,
  updateJournalEntry: mocks.updateJournalEntry,
}));
vi.mock("@/hooks/use-app-toast", () => ({
  useAppToast: () => ({ error: vi.fn(), success: mocks.success }),
}));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@radix-ui/themes", async () => {
  const React = await import("react");
  const Wrapper = ({ children }: PropsWithChildren) => React.createElement("div", null, children);
  const TestButton = ({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) =>
    React.createElement("button", props, children);
  return {
    AlertDialog: {
      Root: ({
        children,
        onOpenChange,
        open,
      }: PropsWithChildren<{ onOpenChange(open: boolean): void; open: boolean }>) => (
        <div data-dialog-open={String(open)}>
          {children}
          <button type="button" aria-label="dismiss-dialog" onClick={() => onOpenChange(false)}>
            {"dismiss"}
          </button>
        </div>
      ),
      Cancel: Wrapper,
      Content: Wrapper,
      Description: Wrapper,
      Title: Wrapper,
    },
    Box: Wrapper,
    Button: ({
      loading: _loading,
      ...props
    }: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) => (
      <TestButton {...props} />
    ),
    Flex: Wrapper,
    IconButton: TestButton,
    Tooltip: Wrapper,
  };
});

const user = {
  id: "user-one",
  username: "user-one",
  displayName: "User One",
  keyEncryptionKey: {} as CryptoKey,
} satisfies ClientUser;
const entry = {
  id: "entry-one",
  title: "Entry",
  content: "<p>Entry</p>",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
} satisfies JournalEntry;
const editor = { getHTML: () => entry.content } as Editor;

let container: HTMLDivElement;
let queryClient: QueryClient;
let root: Root;
const onDeleted = vi.fn();
const onSaved = vi.fn();
const onSavingChange = vi.fn();

function getButton(text: string) {
  const button = Array.from(container.querySelectorAll("button")).find(
    (candidate) => candidate.getAttribute("aria-label") === text || candidate.textContent === text,
  );
  if (!button) throw new Error(`Missing ${text} button`);
  return button;
}

function getDialog() {
  const dialog = container.querySelector<HTMLElement>("[data-dialog-open]");
  if (!dialog) throw new Error("Missing test dialog");
  return dialog;
}

function renderActions(
  draftDirty = true,
  title = entry.title,
  currentEntry: JournalEntry | null = entry,
) {
  root.render(
    <QueryClientProvider client={queryClient}>
      <JournalEditorActions
        defaultTitle="Untitled entry"
        draftDirty={draftDirty}
        editor={editor}
        entry={currentEntry ?? undefined}
        onDeleted={onDeleted}
        onSaved={onSaved}
        onSavingChange={onSavingChange}
        title={title}
        user={user}
      />
    </QueryClientProvider>,
  );
}

beforeEach(async () => {
  vi.clearAllMocks();
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  queryClient = new QueryClient();
  queryClient.setQueryData(journalEntriesQueryKey(user.id), {
    pages: [{ entries: [entry], unreadableEntries: [], nextCursor: null }],
    pageParams: [null],
  });
  await act(async () => renderActions());
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

describe("journal entry writes", () => {
  it("disables writing while saving and commits the result", async () => {
    const update = Promise.withResolvers<JournalEntry>();
    const refresh = Promise.withResolvers<void>();
    const savedEntry = { ...entry, title: "Saved entry", updatedAt: "2026-01-02T00:00:00.000Z" };
    const invalidateQueries = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockReturnValue(refresh.promise);
    mocks.updateJournalEntry.mockReturnValueOnce(update.promise);
    await act(async () => {
      getButton("save").click();
      await vi.waitFor(() => expect(getButton("save").disabled).toBe(true));
      getButton("save").click();
      await vi.waitFor(() => expect(mocks.updateJournalEntry).toHaveBeenCalledOnce());
    });
    update.resolve(savedEntry);

    await act(async () => {
      await vi.waitFor(() => expect(invalidateQueries).toHaveBeenCalledOnce());
    });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: journalEntriesQueryKey(user.id) });
    expect(onSaved).not.toHaveBeenCalled();
    expect(onSavingChange).toHaveBeenCalledTimes(1);
    expect(getButton("save").disabled).toBe(true);

    refresh.resolve();
    await act(async () => vi.waitFor(() => expect(onSaved).toHaveBeenCalledWith(savedEntry)));
    expect(onSavingChange).toHaveBeenNthCalledWith(1, true);
    expect(onSavingChange).toHaveBeenLastCalledWith(false);
  });

  it("disables save for a clean draft", async () => {
    await act(async () => renderActions(false));
    expect(getButton("save").disabled).toBe(true);
  });

  it("normalizes a blank title before saving", async () => {
    const savedEntry = { ...entry, title: "Untitled entry" };
    mocks.updateJournalEntry.mockResolvedValueOnce(savedEntry);

    await act(async () => {
      renderActions(true, "   ");
    });
    expect(getButton("save").disabled).toBe(false);

    await act(async () => {
      getButton("save").click();
      await vi.waitFor(() => expect(mocks.updateJournalEntry).toHaveBeenCalledOnce());
    });
    expect(mocks.updateJournalEntry).toHaveBeenCalledWith(
      { id: entry.id, title: "Untitled entry", content: entry.content },
      user,
    );
  });

  it("creates a new entry only when its local draft is saved", async () => {
    const createdEntry = { ...entry, id: "created-entry", title: "Untitled entry" };
    mocks.createJournalEntry.mockResolvedValueOnce(createdEntry);

    await act(async () => renderActions(true, "   ", null));
    expect(getButton("save").disabled).toBe(false);
    expect(mocks.createJournalEntry).not.toHaveBeenCalled();

    await act(async () => {
      getButton("save").click();
      await vi.waitFor(() => expect(onSaved).toHaveBeenCalledWith(createdEntry));
    });

    expect(mocks.createJournalEntry).toHaveBeenCalledWith(
      { title: "Untitled entry", content: entry.content },
      user,
    );
    expect(mocks.updateJournalEntry).not.toHaveBeenCalled();
    expect(mocks.success).toHaveBeenCalledWith("success.created");
    expect(container.textContent).not.toContain("deleteEntry");
  });
});

describe("journal entry deletion", () => {
  it("keeps the dialog open on failure and closes it after success", async () => {
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    await act(async () => getButton("deleteEntry").click());
    expect(getDialog().dataset["dialogOpen"]).toBe("true");

    mocks.deleteJournalEntry.mockRejectedValueOnce(new Error("delete failed"));
    await act(async () => {
      getButton("delete").click();
      await vi.waitFor(() => expect(getButton("delete").disabled).toBe(false));
    });
    expect(getDialog().dataset["dialogOpen"]).toBe("true");

    mocks.deleteJournalEntry.mockResolvedValueOnce({ id: entry.id });
    await act(async () => {
      getButton("delete").click();
      await vi.waitFor(() => expect(onDeleted).toHaveBeenCalledOnce());
    });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: journalEntriesQueryKey(user.id) });
    expect(getDialog().dataset["dialogOpen"]).toBe("false");
  });
});
