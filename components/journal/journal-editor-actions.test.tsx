// @vitest-environment jsdom

import { Theme } from "@radix-ui/themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Editor } from "@tiptap/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JournalEditorActions } from "@/components/journal/journal-editor-actions";
import { journalEntriesQueryKey } from "@/components/journal/journal-query";
import type { ClientUser } from "@/lib/api/auth/user.type";
import type { JournalEntry } from "@/lib/api/journal/journal.type";

const mocks = vi.hoisted(() => ({
  createJournalEntry: vi.fn(),
  updateJournalEntry: vi.fn(),
  success: vi.fn(),
}));

vi.mock("@/api/journal/journal", () => ({
  createJournalEntry: mocks.createJournalEntry,
  updateJournalEntry: mocks.updateJournalEntry,
}));
vi.mock("@/hooks/use-app-toast", () => ({
  useAppToast: () => ({ error: vi.fn(), success: mocks.success }),
}));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));

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

let queryClient: QueryClient;
const onDeleteEntry = vi.fn();
const onSaved = vi.fn();
const onSavingChange = vi.fn();

function renderActions(
  draftDirty = true,
  title = entry.title,
  currentEntry: JournalEntry | null = entry,
) {
  return render(
    <QueryClientProvider client={queryClient}>
      <Theme>
        <JournalEditorActions
          defaultTitle="Untitled entry"
          draftDirty={draftDirty}
          editor={editor}
          entry={currentEntry ?? undefined}
          onDeleteEntry={onDeleteEntry}
          onSaved={onSaved}
          onSavingChange={onSavingChange}
          title={title}
          user={user}
        />
      </Theme>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  queryClient = new QueryClient();
  queryClient.setQueryData(journalEntriesQueryKey(user.id), {
    pages: [{ entries: [entry], unreadableEntries: [], nextCursor: null }],
    pageParams: [null],
  });
});

describe("journal entry writes", () => {
  it("disables writing while saving and commits the result", async () => {
    const userEventController = userEvent.setup();
    renderActions();
    const update = Promise.withResolvers<JournalEntry>();
    const refresh = Promise.withResolvers<void>();
    const savedEntry = { ...entry, title: "Saved entry", updatedAt: "2026-01-02T00:00:00.000Z" };
    const invalidateQueries = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockReturnValue(refresh.promise);
    mocks.updateJournalEntry.mockReturnValueOnce(update.promise);
    const saveButton = screen.getByRole<HTMLButtonElement>("button", { name: "save" });
    await userEventController.click(saveButton);
    await waitFor(() => expect(saveButton).toBeDisabled());
    await userEventController.click(saveButton);
    await waitFor(() => expect(mocks.updateJournalEntry).toHaveBeenCalledOnce());
    update.resolve(savedEntry);

    await waitFor(() => expect(invalidateQueries).toHaveBeenCalledOnce());
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: journalEntriesQueryKey(user.id) });
    expect(onSaved).not.toHaveBeenCalled();
    expect(onSavingChange).toHaveBeenCalledTimes(1);
    expect(saveButton).toBeDisabled();

    refresh.resolve();
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(savedEntry));
    expect(onSavingChange).toHaveBeenNthCalledWith(1, true);
    expect(onSavingChange).toHaveBeenLastCalledWith(false);
  });

  it("disables save for a clean draft", async () => {
    renderActions(false);
    expect(screen.getByRole("button", { name: "save" })).toBeDisabled();
  });

  it("normalizes a blank title before saving", async () => {
    const userEventController = userEvent.setup();
    const savedEntry = { ...entry, title: "Untitled entry" };
    mocks.updateJournalEntry.mockResolvedValueOnce(savedEntry);

    renderActions(true, "   ");
    const saveButton = screen.getByRole<HTMLButtonElement>("button", { name: "save" });
    expect(saveButton).toBeEnabled();

    await userEventController.click(saveButton);
    await waitFor(() => expect(mocks.updateJournalEntry).toHaveBeenCalledOnce());
    expect(mocks.updateJournalEntry).toHaveBeenCalledWith(
      { id: entry.id, title: "Untitled entry", content: entry.content },
      user,
    );
  });

  it("creates a new entry only when its local draft is saved", async () => {
    const userEventController = userEvent.setup();
    const createdEntry = { ...entry, id: "created-entry", title: "Untitled entry" };
    mocks.createJournalEntry.mockResolvedValueOnce(createdEntry);

    renderActions(true, "   ", null);
    const saveButton = screen.getByRole<HTMLButtonElement>("button", { name: "save" });
    expect(saveButton).toBeEnabled();
    expect(mocks.createJournalEntry).not.toHaveBeenCalled();

    await userEventController.click(saveButton);
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(createdEntry));

    expect(mocks.createJournalEntry).toHaveBeenCalledWith(
      { title: "Untitled entry", content: entry.content },
      user,
    );
    expect(mocks.updateJournalEntry).not.toHaveBeenCalled();
    expect(mocks.success).toHaveBeenCalledWith("success.created");
    expect(screen.queryByRole("button", { name: "deleteEntry" })).not.toBeInTheDocument();
  });
});

describe("journal entry deletion", () => {
  it("delegates deletion of the current entry", async () => {
    const userEventController = userEvent.setup();
    renderActions();
    await userEventController.click(screen.getByRole("button", { name: "deleteEntry" }));

    expect(onDeleteEntry).toHaveBeenCalledExactlyOnceWith(entry);
  });
});
