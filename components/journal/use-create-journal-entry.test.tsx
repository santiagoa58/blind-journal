// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ClientUser } from "@/api/auth/user.type";
import type { JournalEntry } from "@/api/journal/journal.type";
import { journalEntriesQueryKey } from "@/components/journal/journal-query";
import { useCreateJournalEntry } from "@/components/journal/use-create-journal-entry";
import { useUser } from "@/state/user.state";

const mocks = vi.hoisted(() => ({ createJournalEntry: vi.fn(), success: vi.fn() }));
vi.mock("@/api/journal/journal", () => ({ createJournalEntry: mocks.createJournalEntry }));
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
  id: "created-entry",
  title: "New entry",
  content: "",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
} satisfies JournalEntry;

let container: HTMLDivElement;
let queryClient: QueryClient;
let root: Root;
const onCreated = vi.fn();

function CreateControl() {
  const control = useCreateJournalEntry(user, onCreated);
  return (
    <button type="button" disabled={control.isPending} onClick={control.createEntry}>
      {"create"}
    </button>
  );
}

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  useUser.getState().setUser(user);
  queryClient = new QueryClient();
  queryClient.setQueryData(journalEntriesQueryKey(user.id), {
    pages: [{ entries: [], unreadableEntries: [], nextCursor: null }],
    pageParams: [null],
  });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <CreateControl />
      </QueryClientProvider>,
    );
  });
});

afterEach(async () => {
  await act(async () => root.unmount());
  useUser.getState().setUser(null);
  container.remove();
});

describe("useCreateJournalEntry", () => {
  function getCreateButton() {
    const button = container.querySelector<HTMLButtonElement>("button");
    if (!button) throw new Error("Missing create button");
    return button;
  }

  it("ignores duplicate submissions and selects the completed entry", async () => {
    const creation = Promise.withResolvers<JournalEntry>();
    const refresh = Promise.withResolvers<void>();
    const invalidateQueries = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockReturnValue(refresh.promise);
    mocks.createJournalEntry.mockReturnValueOnce(creation.promise);
    const button = getCreateButton();

    await act(async () => {
      button.click();
      button.click();
      await vi.waitFor(() => expect(mocks.createJournalEntry).toHaveBeenCalledOnce());
    });
    creation.resolve(entry);

    await act(async () => {
      await vi.waitFor(() => expect(invalidateQueries).toHaveBeenCalledOnce());
    });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: journalEntriesQueryKey(user.id) });
    expect(button.disabled).toBe(true);
    expect(onCreated).not.toHaveBeenCalled();

    refresh.resolve();
    await act(async () => vi.waitFor(() => expect(onCreated).toHaveBeenCalledWith(entry.id)));
    expect(button.disabled).toBe(false);
    expect(mocks.success).toHaveBeenCalledWith("success.created");
  });

  it("does not commit completion after the session is cleared", async () => {
    const creation = Promise.withResolvers<JournalEntry>();
    mocks.createJournalEntry.mockReturnValueOnce(creation.promise);
    await act(async () => getCreateButton().click());
    useUser.getState().setUser(null);
    creation.resolve(entry);
    await act(async () => vi.waitFor(() => expect(getCreateButton().disabled).toBe(false)));
    expect(onCreated).not.toHaveBeenCalled();
    expect(mocks.success).not.toHaveBeenCalled();
  });
});
