// @vitest-environment jsdom

import { Theme } from "@radix-ui/themes";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClientUser } from "@/api/auth/user.type";
import type { JournalEntry } from "@/api/journal/journal.type";
import { JournalContent } from "@/components/journal/journal-content";

const mocks = vi.hoisted(() => ({
  replaceRoute: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/journal",
  useRouter: () => ({ replace: mocks.replaceRoute }),
}));

vi.mock("@/hooks/use-logout", () => ({
  useLogout: () => ({ signOut: mocks.signOut }),
}));
vi.mock("@/components/journal/journal-desktop-sidebar", () => ({
  JournalDesktopSidebar: ({
    entries,
    onCollapse,
    onCreateEntry,
    onLocaleChange,
    onSelectEntry,
    onSignOut,
  }: {
    entries: JournalEntry[];
    onCollapse(): void;
    onCreateEntry(): void;
    onLocaleChange(locale: "en" | "es"): void;
    onSelectEntry(id: string): void;
    onSignOut(): void;
  }) => (
    <nav aria-label="desktop navigation">
      <button type="button" onClick={onCollapse}>
        {"hide-navigation"}
      </button>
      {entries.map((entry) => (
        <button key={entry.id} type="button" onClick={() => onSelectEntry(entry.id)}>
          {entry.id}
        </button>
      ))}
      <button type="button" onClick={onCreateEntry}>
        {"create"}
      </button>
      <button type="button" onClick={() => onLocaleChange("es")}>
        {"change-locale"}
      </button>
      <button type="button" onClick={onSignOut}>
        {"logout"}
      </button>
    </nav>
  ),
}));
vi.mock("@/components/journal/entry-list", () => ({
  EntryList: () => null,
}));
vi.mock("@/components/journal/journal-draft-guard", () => ({
  JournalDraftGuard: ({
    open,
    onCancel,
    onDiscard,
  }: {
    open: boolean;
    onCancel(): void;
    onDiscard(): void;
  }) =>
    open ? (
      <div role="alertdialog" aria-label="discard draft">
        <button type="button" onClick={onCancel}>
          {"cancel-discard"}
        </button>
        <button
          type="button"
          onClick={() => {
            onDiscard();
            onCancel();
          }}
        >
          {"confirm-discard"}
        </button>
      </div>
    ) : null,
}));
vi.mock("@/components/journal/journal-empty-card", () => ({ JournalEmptyCard: () => null }));
vi.mock("@/components/journal/journal-entry-delete-dialog", () => ({
  JournalEntryDeleteDialog: () => null,
}));
vi.mock("@/components/journal/mobile/journal-mobile-header", () => ({
  JournalMobileHeader: () => null,
}));
vi.mock("@/components/journal/unreadable-entries-notice", () => ({
  UnreadableEntriesNotice: () => null,
}));
vi.mock("@/components/journal/journal-editor", async () => {
  const React = await import("react");

  return {
    JournalEditor: ({
      entry,
      onDeleteEntry,
      onDraftChange,
      onShowNavigation,
    }: {
      entry: JournalEntry | undefined;
      onDeleteEntry(entry: JournalEntry): void;
      onDraftChange(dirty: boolean): void;
      onShowNavigation(): void;
    }) => {
      const [edited, setEdited] = React.useState(false);

      return (
        <section aria-label={`editor ${entry?.id ?? "new"}`}>
          <output aria-label="editor state">{`edited:${edited}`}</output>
          <button
            type="button"
            onClick={() => {
              setEdited(true);
              onDraftChange(true);
            }}
          >
            {"make-dirty"}
          </button>
          <button type="button" onClick={onShowNavigation}>
            {"show-navigation"}
          </button>
          {entry ? (
            <button type="button" onClick={() => onDeleteEntry(entry)}>
              {"delete-current"}
            </button>
          ) : null}
        </section>
      );
    },
  };
});

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
const secondEntry = { ...firstEntry, id: "second-entry", title: "Second entry" };

function renderContent() {
  return render(
    <Theme>
      <JournalContent
        entries={[firstEntry, secondEntry]}
        hasMoreEntries={false}
        loadingMoreEntries={false}
        loadMoreEntries={vi.fn()}
        unreadableEntries={[]}
        user={user}
      />
    </Theme>,
  );
}

beforeEach(() => {
  renderContent();
});

describe("JournalContent", () => {
  it("keeps the dirty entry mounted until a requested selection is confirmed", async () => {
    const userEventController = userEvent.setup();
    await userEventController.click(screen.getByRole("button", { name: "make-dirty" }));
    await userEventController.click(screen.getByRole("button", { name: secondEntry.id }));
    expect(screen.getByRole("region", { name: `editor ${firstEntry.id}` })).toBeDefined();

    await userEventController.click(screen.getByRole("button", { name: "confirm-discard" }));
    expect(screen.getByRole("region", { name: `editor ${secondEntry.id}` })).toBeDefined();
  });

  it.each([
    ["change-locale", mocks.replaceRoute],
    ["logout", mocks.signOut],
  ] as const)("guards %s with the same draft owner", async (action, expected) => {
    const userEventController = userEvent.setup();
    await userEventController.click(screen.getByRole("button", { name: "make-dirty" }));
    await userEventController.click(screen.getByRole("button", { name: action }));
    expect(expected).not.toHaveBeenCalled();

    await userEventController.click(screen.getByRole("button", { name: "confirm-discard" }));
    expect(expected).toHaveBeenCalledOnce();
  });

  it("actually resets the current editor when discarding a draft to create", async () => {
    const userEventController = userEvent.setup();
    await userEventController.click(screen.getByRole("button", { name: "make-dirty" }));
    expect(screen.getByRole("status", { name: "editor state" }).textContent).toBe("edited:true");

    await userEventController.click(screen.getByRole("button", { name: "create" }));
    await userEventController.click(screen.getByRole("button", { name: "confirm-discard" }));

    expect(screen.getByRole("region", { name: "editor new" })).toBeDefined();
    expect(screen.getByRole("status", { name: "editor state" }).textContent).toBe("edited:false");
  });

  it("lets the editor reclaim the desktop navigation space", async () => {
    const userEventController = userEvent.setup();
    expect(screen.getByRole("navigation", { name: "desktop navigation" })).toBeDefined();

    await userEventController.click(screen.getByRole("button", { name: "hide-navigation" }));

    expect(screen.queryByRole("navigation", { name: "desktop navigation" })).toBeNull();
    expect(screen.getByRole("region", { name: `editor ${firstEntry.id}` })).toBeDefined();

    await userEventController.click(screen.getByRole("button", { name: "show-navigation" }));
    expect(screen.getByRole("navigation", { name: "desktop navigation" })).toBeDefined();
  });
});
