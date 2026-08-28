// @vitest-environment jsdom

import { Theme } from "@radix-ui/themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClientUser } from "@/api/auth/user.type";
import type { JournalEntry } from "@/api/journal/journal.type";
import { useAppSession } from "@/client-state/app-session.state";
import { JournalWorkspace } from "@/components/journal/journal-workspace";
import type { Base64Url } from "@/types/base64";

const mocks = vi.hoisted(() => ({
  listJournalEntriesPage: vi.fn(),
  reportClientError: vi.fn(),
}));

vi.mock("@/api/journal/journal", () => ({
  listJournalEntriesPage: mocks.listJournalEntriesPage,
}));
vi.mock("@/client.error", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/client.error")>()),
  reportClientError: mocks.reportClientError,
}));
vi.mock("next-intl", () => ({
  useTranslations:
    (namespace = "") =>
    (key: string) =>
      namespace.length > 0 ? `${namespace}.${key}` : key,
}));
vi.mock("@/components/journal/journal-content", () => ({
  JournalContent: ({
    entries,
    hasMoreEntries,
    loadMoreEntries,
  }: {
    entries: JournalEntry[];
    hasMoreEntries: boolean;
    loadMoreEntries(): void;
  }) => (
    <section aria-label="journal content">
      <output aria-label="loaded entries">{entries.map(({ title }) => title).join(", ")}</output>
      {hasMoreEntries ? (
        <button type="button" onClick={loadMoreEntries}>
          {"load more"}
        </button>
      ) : null}
    </section>
  ),
}));

const user = {
  id: "user-one",
  username: "writer",
  displayName: "Writer",
  keyEncryptionKey: {} as CryptoKey,
} satisfies ClientUser;
const firstEntry = {
  id: "first-entry",
  title: "First entry",
  content: "<p>First</p>",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
} satisfies JournalEntry;
const secondEntry = { ...firstEntry, id: "second-entry", title: "Second entry" };
const nextCursor = "next-page" as Base64Url;

function renderWorkspace() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <Theme>
        <JournalWorkspace />
      </Theme>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  useAppSession.setState({ initialized: true, session: { status: "unlocked", user } });
});

describe("JournalWorkspace", () => {
  it("reports an unexpected loading error and recovers when retried", async () => {
    const userEventController = userEvent.setup();
    const error = new Error("journal unavailable");
    mocks.listJournalEntriesPage
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce({ entries: [], unreadableEntries: [], nextCursor: null });
    renderWorkspace();

    expect(await screen.findByRole("alert")).toHaveTextContent("api.errors.unexpected");
    expect(mocks.reportClientError).toHaveBeenCalledExactlyOnceWith(error);

    await userEventController.click(screen.getByRole("button", { name: "common.actions.retry" }));
    expect(await screen.findByRole("region", { name: "journal content" })).toBeInTheDocument();
  });

  it("loads and combines another page through the query boundary", async () => {
    const userEventController = userEvent.setup();
    mocks.listJournalEntriesPage
      .mockResolvedValueOnce({
        entries: [firstEntry],
        unreadableEntries: [],
        nextCursor,
      })
      .mockResolvedValueOnce({
        entries: [secondEntry],
        unreadableEntries: [],
        nextCursor: null,
      });
    renderWorkspace();

    expect(await screen.findByRole("status", { name: "loaded entries" })).toHaveTextContent(
      firstEntry.title,
    );
    await userEventController.click(screen.getByRole("button", { name: "load more" }));

    await waitFor(() =>
      expect(screen.getByRole("status", { name: "loaded entries" })).toHaveTextContent(
        `${firstEntry.title}, ${secondEntry.title}`,
      ),
    );
    expect(mocks.listJournalEntriesPage.mock.calls[1]?.[1]).toBe(nextCursor);
  });
});
