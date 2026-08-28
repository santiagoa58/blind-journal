// @vitest-environment jsdom

import { Theme } from "@radix-ui/themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ClientUser } from "@/api/auth/user.type";
import type { JournalEntry } from "@/api/journal/journal.type";
import { JournalEntryDeleteDialog } from "@/components/journal/journal-entry-delete-dialog";
import { journalEntriesQueryKey } from "@/components/journal/journal-query";

const mocks = vi.hoisted(() => ({
  deleteJournalEntry: vi.fn(),
  success: vi.fn(),
}));

vi.mock("@/api/journal/journal", () => ({
  deleteJournalEntry: mocks.deleteJournalEntry,
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

describe("JournalEntryDeleteDialog", () => {
  it("prevents duplicate deletion and closes only after refreshing the entry list", async () => {
    const userEventController = userEvent.setup();
    const deletion = Promise.withResolvers<null>();
    const queryClient = new QueryClient();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue();
    const onDeleted = vi.fn();
    const onOpenChange = vi.fn();
    mocks.deleteJournalEntry.mockReturnValueOnce(deletion.promise);

    render(
      <QueryClientProvider client={queryClient}>
        <Theme>
          <JournalEntryDeleteDialog
            entry={entry}
            includesUnsavedChanges
            onDeleted={onDeleted}
            onOpenChange={onOpenChange}
            open
            user={user}
          />
        </Theme>
      </QueryClientProvider>,
    );

    expect(screen.getByRole("alertdialog", { name: "deleteDialog.title" })).toBeDefined();
    expect(screen.getByText("deleteDialog.descriptionWithUnsavedChanges")).toBeDefined();
    const deleteButton = screen.getByRole<HTMLButtonElement>("button", { name: "delete" });

    await userEventController.click(deleteButton);
    await waitFor(() => expect(deleteButton.disabled).toBe(true));
    await userEventController.click(deleteButton);
    expect(mocks.deleteJournalEntry).toHaveBeenCalledExactlyOnceWith(entry.id);
    expect(onOpenChange).not.toHaveBeenCalled();

    deletion.resolve(null);
    await waitFor(() => expect(onDeleted).toHaveBeenCalledExactlyOnceWith(entry.id));
    expect(invalidateQueries).toHaveBeenCalledExactlyOnceWith({
      queryKey: journalEntriesQueryKey(user.id),
    });
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    expect(mocks.success).toHaveBeenCalledExactlyOnceWith("success.deleted");
  });
});
