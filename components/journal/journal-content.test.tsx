// @vitest-environment jsdom

import { act, type PropsWithChildren } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ClientUser } from "@/api/auth/user.type";
import type { JournalEntry } from "@/api/journal/journal.type";
import { JournalContent } from "@/components/journal/journal-content";

const mocks = vi.hoisted(() => ({
  replaceRoute: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@radix-ui/themes", async () => {
  const React = await import("react");
  const Wrapper = ({ children }: PropsWithChildren) => React.createElement("div", null, children);
  return {
    Box: Wrapper,
    Flex: Wrapper,
    Heading: Wrapper,
    Separator: Wrapper,
    Text: Wrapper,
    VisuallyHidden: Wrapper,
  };
});
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
    <div data-testid="desktop-sidebar">
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
    </div>
  ),
}));
vi.mock("@/components/journal/entry-list", () => ({
  EntryList: ({
    entries,
    onSelectEntry,
  }: {
    entries: JournalEntry[];
    onSelectEntry(id: string): void;
  }) => (
    <>
      {entries.map((entry) => (
        <button key={entry.id} type="button" onClick={() => onSelectEntry(entry.id)}>
          {entry.id}
        </button>
      ))}
    </>
  ),
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
      <>
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
      </>
    ) : null,
}));
vi.mock("@/components/journal/journal-empty-card", () => ({ JournalEmptyCard: () => null }));
vi.mock("@/components/journal/journal-entry-delete-dialog", () => ({
  JournalEntryDeleteDialog: ({ entry }: { entry: JournalEntry }) => (
    <div data-testid="entry-delete-dialog" data-entry-id={entry.id} />
  ),
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
        <div data-testid="editor" data-entry-id={entry?.id ?? "new"} data-edited={String(edited)}>
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
        </div>
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

let container: HTMLDivElement;
let root: Root;

function renderContent() {
  root.render(
    <JournalContent
      entries={[firstEntry, secondEntry]}
      hasMoreEntries={false}
      loadingMoreEntries={false}
      loadMoreEntries={vi.fn()}
      unreadableEntries={[]}
      user={user}
    />,
  );
}

function click(text: string) {
  const button = Array.from(container.querySelectorAll("button")).find(
    (candidate) => candidate.textContent === text,
  );
  if (!button) throw new Error(`Missing ${text} button`);
  button.click();
}

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => {
    renderContent();
  });
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

describe("JournalContent", () => {
  it("keeps the dirty entry mounted until a requested selection is confirmed", async () => {
    await act(async () => click("make-dirty"));
    await act(async () => click(secondEntry.id));
    expect(container.querySelector("[data-testid='editor']")?.getAttribute("data-entry-id")).toBe(
      firstEntry.id,
    );

    await act(async () => click("confirm-discard"));
    expect(container.querySelector("[data-testid='editor']")?.getAttribute("data-entry-id")).toBe(
      secondEntry.id,
    );
  });

  it.each([
    ["change-locale", mocks.replaceRoute],
    ["logout", mocks.signOut],
  ] as const)("guards %s with the same draft owner", async (action, expected) => {
    await act(async () => click("make-dirty"));
    await act(async () => click(action));
    expect(expected).not.toHaveBeenCalled();

    await act(async () => click("confirm-discard"));
    expect(expected).toHaveBeenCalledOnce();
  });

  it("actually resets the current editor when discarding a draft to create", async () => {
    await act(async () => click("make-dirty"));
    expect(container.querySelector("[data-testid='editor']")?.getAttribute("data-edited")).toBe(
      "true",
    );

    await act(async () => click("create"));
    await act(async () => click("confirm-discard"));

    expect(container.querySelector("[data-testid='editor']")?.getAttribute("data-edited")).toBe(
      "false",
    );
    expect(container.querySelector("[data-testid='editor']")?.getAttribute("data-entry-id")).toBe(
      "new",
    );
  });

  it("opens a new entry locally without adding it to the persisted list", async () => {
    expect(container.querySelectorAll("[data-testid='desktop-sidebar'] button")).toHaveLength(6);

    await act(async () => click("create"));

    expect(container.querySelector("[data-testid='editor']")?.getAttribute("data-entry-id")).toBe(
      "new",
    );
    expect(container.querySelectorAll("[data-testid='desktop-sidebar'] button")).toHaveLength(6);
  });

  it("uses the shared deletion dialog for the current editor entry", async () => {
    await act(async () => click("delete-current"));

    expect(
      container.querySelector("[data-testid='entry-delete-dialog']")?.getAttribute("data-entry-id"),
    ).toBe(firstEntry.id);
  });

  it("lets the editor reclaim the desktop navigation space", async () => {
    expect(container.querySelector("[data-testid='desktop-sidebar']")).not.toBeNull();

    await act(async () => click("hide-navigation"));

    expect(container.querySelector("[data-testid='desktop-sidebar']")).toBeNull();
    expect(container.querySelector("[data-testid='editor']")).not.toBeNull();

    await act(async () => click("show-navigation"));
    expect(container.querySelector("[data-testid='desktop-sidebar']")).not.toBeNull();
  });
});
