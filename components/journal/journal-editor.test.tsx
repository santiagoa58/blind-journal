// @vitest-environment jsdom

import { Theme } from "@radix-ui/themes";
import { act, type RenderResult, render, screen, waitFor } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import type { Editor } from "@tiptap/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JournalEditor } from "@/components/journal/journal-editor";
import type { ClientUser } from "@/lib/api/auth/user.type";
import type { JournalEntry } from "@/lib/api/journal/journal.type";

type EditorActions = {
  onSaved: (entry: JournalEntry) => void;
  onSavingChange: (saving: boolean) => void;
};

const onSaved = vi.fn();

const mocks = vi.hoisted(() => ({
  actions: undefined as EditorActions | undefined,
  editor: null as Editor | null,
}));

vi.mock("next-intl", () => ({
  useFormatter: () => ({
    dateTime: () => "date",
    relativeTime: () => "recently",
  }),
  useNow: () => new Date("2026-01-01T00:00:00.000Z"),
  useTranslations: () => (key: string) => key,
}));
vi.mock("@/components/journal/journal-editor-toolbar", () => ({
  JournalEditorToolbar: ({ editor }: { editor: Editor | null }) => {
    mocks.editor = editor;
    return null;
  },
}));
vi.mock("@/components/journal/journal-editor-actions", async () => {
  const React = await import("react");

  return {
    JournalEditorActions: ({
      draftDirty,
      onSaved,
      onSavingChange,
    }: EditorActions & { draftDirty: boolean }) => {
      mocks.actions = { onSaved, onSavingChange };
      return React.createElement("output", { "aria-label": "draft state" }, `dirty:${draftDirty}`);
    },
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
  content: "<p>Entry body</p>",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
} satisfies JournalEntry;

let view: RenderResult;

function TestEditor({ newEntry = false }: { newEntry?: boolean }) {
  const [draftDirty, setDraftDirty] = useState(false);

  return (
    <Theme>
      <JournalEditor
        draftDirty={draftDirty}
        entry={newEntry ? undefined : entry}
        navigationOpen
        onDeleteEntry={vi.fn()}
        onDraftChange={setDraftDirty}
        onSaved={onSaved}
        onShowNavigation={vi.fn()}
        user={user}
      />
    </Theme>
  );
}

async function changeTitle(user: UserEvent, value: string) {
  const title = screen.getByRole("textbox", { name: "entryTitleLabel" });
  await user.clear(title);
  await user.type(title, value);
}

function expectDirty(dirty: boolean) {
  expect(screen.getByRole("status", { name: "draft state" })).toHaveTextContent(`dirty:${dirty}`);
}

function expectDocumentStatus(status: "saved" | "saving" | "unsaved") {
  expect(screen.getByText(`documentStatus.${status}`)).toBeInTheDocument();
}

beforeEach(async () => {
  mocks.actions = undefined;
  mocks.editor = null;
  view = render(<TestEditor />);
  await waitFor(() => expect(mocks.editor).not.toBeNull());
});

describe("JournalEditor draft state", () => {
  it("uses a labeled Radix title field and focuses the editor from the document surface", async () => {
    const user = userEvent.setup();
    const title = screen.getByRole<HTMLInputElement>("textbox", { name: "entryTitleLabel" });
    const article = screen.getByRole("article", { name: entry.title });
    if (!mocks.editor) throw new Error("Missing editor");

    await user.pointer({ keys: "[MouseLeft]", target: article });
    await waitFor(() => expect(mocks.editor?.isFocused).toBe(true));

    await user.click(title);
    expect(title).toHaveFocus();
  });

  it("compares title and body changes with the saved Tiptap document", async () => {
    const user = userEvent.setup();
    await changeTitle(user, "Changed title");
    expectDirty(true);

    await changeTitle(user, entry.title);
    expectDirty(false);

    await act(async () => {
      mocks.editor?.commands.insertContent(" changed");
    });
    expectDirty(true);

    await act(async () => {
      mocks.editor?.commands.undo();
    });
    expectDirty(false);
  });

  it("normalizes a blank title to the journal default on blur", async () => {
    const user = userEvent.setup();
    const title = screen.getByRole<HTMLInputElement>("textbox", { name: "entryTitleLabel" });

    await changeTitle(user, "   ");
    expectDirty(true);

    await user.click(title);
    await user.click(document.body);
    expect(title).toHaveValue("newEntry.title");
    expectDirty(true);
  });

  it("distinguishes saved, unsaved, and saving document states", async () => {
    const user = userEvent.setup();
    expectDocumentStatus("saved");

    await changeTitle(user, "Changed title");
    expectDocumentStatus("unsaved");

    await act(async () => mocks.actions?.onSavingChange(true));
    expectDocumentStatus("saving");

    await act(async () => mocks.actions?.onSavingChange(false));
    expectDocumentStatus("unsaved");

    await changeTitle(user, entry.title);
    expectDocumentStatus("saved");
  });

  it("uses a successful save as the next document checkpoint", async () => {
    await act(async () => {
      mocks.editor?.commands.insertContent(" saved");
    });
    expectDirty(true);

    await act(async () => {
      mocks.actions?.onSaved({
        ...entry,
        content: mocks.editor?.getHTML() ?? entry.content,
        updatedAt: "2026-01-02T00:00:00.000Z",
      });
    });
    expectDirty(false);

    await act(async () => {
      mocks.actions?.onSavingChange(true);
      mocks.actions?.onSavingChange(false);
    });
    expectDirty(false);

    await act(async () => {
      mocks.editor?.commands.insertContent(" changed again");
    });
    expectDirty(true);
    expect(onSaved).toHaveBeenCalledWith(
      expect.objectContaining({ id: entry.id, updatedAt: "2026-01-02T00:00:00.000Z" }),
    );
  });

  it("presents a new entry as an unsaved local document", async () => {
    view.rerender(<TestEditor key="new" newEntry />);
    await waitFor(() => expect(mocks.editor).not.toBeNull());

    expect(screen.getByRole("textbox", { name: "entryTitleLabel" })).toHaveValue("newEntry.title");
    expectDocumentStatus("unsaved");
  });
});
