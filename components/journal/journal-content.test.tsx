// @vitest-environment jsdom

import { Theme } from "@radix-ui/themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JournalContent } from "@/components/journal/journal-content";
import { englishMessages } from "@/i18n/messages";
import type { ClientUser } from "@/lib/api/auth/user.type";
import type { JournalEntry } from "@/lib/api/journal/journal.type";

const mocks = vi.hoisted(() => ({
  replaceRoute: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/hooks/use-app-toast", () => ({
  useAppToast: () => ({ error: vi.fn(), success: vi.fn() }),
}));
vi.mock("@/hooks/use-logout", () => ({
  useLogout: () => ({ signOut: mocks.signOut }),
}));
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/journal",
  useRouter: () => ({ replace: mocks.replaceRoute }),
}));

const user = {
  id: "user-one",
  username: "user-one",
  displayName: "User One",
  keyEncryptionKey: {} as CryptoKey,
} satisfies ClientUser;
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
} satisfies JournalEntry;

function renderContent() {
  return render(
    <NextIntlClientProvider locale="en" messages={englishMessages} timeZone="UTC">
      <QueryClientProvider client={new QueryClient()}>
        <Theme>
          <JournalContent
            entries={[firstEntry, secondEntry]}
            hasMoreEntries={false}
            loadingMoreEntries={false}
            loadMoreEntries={vi.fn()}
            unreadableEntries={[]}
            user={user}
          />
        </Theme>
      </QueryClientProvider>
    </NextIntlClientProvider>,
  );
}

async function makeCurrentEntryDirty(userEventController: ReturnType<typeof userEvent.setup>) {
  const title = screen.getByRole<HTMLInputElement>("textbox", { name: "Entry title" });
  await userEventController.clear(title);
  await userEventController.type(title, "Unsaved title");
  expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
  return title;
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

describe("JournalContent", () => {
  it("keeps an unsaved entry open until the user confirms a real entry selection", async () => {
    const userEventController = userEvent.setup();
    renderContent();
    const title = await makeCurrentEntryDirty(userEventController);

    const navigation = screen.getByRole("complementary", { name: "Journal navigation" });
    const secondEntryOption = within(navigation).getByRole("radio", {
      name: `Open ${secondEntry.title}`,
    });
    await userEventController.click(secondEntryOption);

    expect(
      screen.getByRole("alertdialog", { name: "Discard unsaved changes?" }),
    ).toBeInTheDocument();
    expect(title).toHaveValue("Unsaved title");

    await userEventController.click(screen.getByRole("button", { name: "Discard changes" }));
    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: "Entry title" })).toHaveValue(secondEntry.title),
    );
    expect(secondEntryOption).toBeChecked();
  });

  it("keeps an unsaved entry open until the user confirms creating a new entry", async () => {
    const userEventController = userEvent.setup();
    renderContent();
    const title = await makeCurrentEntryDirty(userEventController);
    const navigation = screen.getByRole("complementary", { name: "Journal navigation" });

    await userEventController.click(within(navigation).getByRole("button", { name: "New entry" }));

    expect(
      screen.getByRole("alertdialog", { name: "Discard unsaved changes?" }),
    ).toBeInTheDocument();
    expect(title).toHaveValue("Unsaved title");

    await userEventController.click(screen.getByRole("button", { name: "Discard changes" }));
    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: "Entry title" })).toHaveValue("Untitled entry"),
    );
  });

  it("does not change locale until the user discards the unsaved entry", async () => {
    const userEventController = userEvent.setup();
    renderContent();
    await makeCurrentEntryDirty(userEventController);
    const navigation = screen.getByRole("complementary", { name: "Journal navigation" });

    await userEventController.click(
      within(navigation).getByRole("button", { name: user.displayName }),
    );
    const languageMenuItem = screen.getByRole("menuitem", { name: "Language: English" });
    languageMenuItem.focus();
    await userEventController.keyboard("{ArrowRight}");
    await userEventController.click(await screen.findByRole("menuitemradio", { name: "Español" }));

    expect(
      screen.getByRole("alertdialog", { name: "Discard unsaved changes?" }),
    ).toBeInTheDocument();
    expect(mocks.replaceRoute).not.toHaveBeenCalled();

    await userEventController.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(mocks.replaceRoute).toHaveBeenCalledOnce();
    expect(mocks.replaceRoute).toHaveBeenCalledWith("/journal", { locale: "es" });
  });

  it("does not sign out until the user discards the unsaved entry", async () => {
    const userEventController = userEvent.setup();
    renderContent();
    await makeCurrentEntryDirty(userEventController);
    const navigation = screen.getByRole("complementary", { name: "Journal navigation" });

    await userEventController.click(
      within(navigation).getByRole("button", { name: user.displayName }),
    );
    await userEventController.click(screen.getByRole("menuitem", { name: "Sign out" }));

    expect(
      screen.getByRole("alertdialog", { name: "Discard unsaved changes?" }),
    ).toBeInTheDocument();
    expect(mocks.signOut).not.toHaveBeenCalled();

    await userEventController.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(mocks.signOut).toHaveBeenCalledOnce();
  });
});
