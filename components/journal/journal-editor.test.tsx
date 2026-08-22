// @vitest-environment jsdom

import { Theme } from "@radix-ui/themes";
import type { Editor } from "@tiptap/react";
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ClientUser } from "@/api/auth/user.type";
import type { JournalEntry } from "@/api/journal/journal.type";
import { JournalEditor } from "@/components/journal/journal-editor";

type EditorActions = {
  onSaved: (entry: JournalEntry) => void;
  onSavingChange: (saving: boolean) => void;
};

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
      return React.createElement("output", { "data-dirty": String(draftDirty) });
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

let container: HTMLDivElement;
let root: Root;

function TestEditor() {
  const [draftDirty, setDraftDirty] = useState(false);

  return (
    <Theme>
      <JournalEditor
        draftDirty={draftDirty}
        entry={entry}
        onDeleted={vi.fn()}
        onDraftChange={setDraftDirty}
        user={user}
      />
    </Theme>
  );
}

function changeTitle(value: string) {
  const title = container.querySelector<HTMLInputElement>("input[type='text']");
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  if (!title || !setValue) throw new Error("Missing title field");
  setValue.call(title, value);
  title.dispatchEvent(new Event("input", { bubbles: true }));
}

function expectDirty(dirty: boolean) {
  expect(container.querySelector("output")?.getAttribute("data-dirty")).toBe(String(dirty));
}

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  mocks.actions = undefined;
  mocks.editor = null;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);

  await act(async () => {
    root.render(<TestEditor />);
  });
  await act(async () => vi.waitFor(() => expect(mocks.editor).not.toBeNull()));
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

describe("JournalEditor draft state", () => {
  it("compares title and body changes with the saved Tiptap document", async () => {
    await act(async () => changeTitle("Changed title"));
    expectDirty(true);

    await act(async () => changeTitle(entry.title));
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
  });
});
