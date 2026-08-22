"use client";

import { ChevronRightIcon } from "@radix-ui/react-icons";
import { Box, Card, Flex, IconButton, Separator, Tooltip } from "@radix-ui/themes";
import { Placeholder } from "@tiptap/extensions";
import { type Editor, EditorContent, useEditor } from "@tiptap/react";
import { useTranslations } from "next-intl";
import { type PointerEvent, useMemo, useRef, useState } from "react";
import type { ClientUser } from "@/api/auth/user.type";
import type { JournalEntry } from "@/api/journal/journal.type";
import { journalEditorExtensions } from "./journal-editor.config";
import styles from "./journal-editor.module.css";
import { JournalEditorActions } from "./journal-editor-actions";
import { JournalEditorDocumentHeader } from "./journal-editor-document-header";
import { JournalEditorToolbar } from "./journal-editor-toolbar";

const css = styles as Record<
  "documentSurface" | "editorBody" | "emptyEditor" | "proseMirror" | "shell" | "toolbarFrame",
  string
>;

type JournalEditorProps = {
  draftDirty: boolean;
  entry: JournalEntry | undefined;
  navigationOpen: boolean;
  onDeleted: () => void;
  onDraftChange: (dirty: boolean) => void;
  onSaved: (entry: JournalEntry) => void;
  onShowNavigation: () => void;
  user: ClientUser;
};

export function JournalEditor({
  draftDirty,
  entry,
  navigationOpen,
  onDeleted,
  onDraftChange,
  onSaved,
  onShowNavigation,
  user,
}: JournalEditorProps) {
  const t = useTranslations("journal-editor");
  const tJournal = useTranslations("journal");
  const tSidebar = useTranslations("sidebar");
  const defaultTitle = tJournal("newEntry.title");
  const [title, setTitle] = useState(entry?.title ?? defaultTitle);
  const [saving, setSaving] = useState(false);
  const savedTitle = useRef(entry?.title ?? defaultTitle);
  const savedDocument = useRef<Editor["state"]["doc"] | null>(null);
  const entryBodyPlaceholder = t("entryBodyPlaceholder");
  const normalizedTitle = title.trim() || defaultTitle;
  const editorExtensions = useMemo(
    () => [
      ...journalEditorExtensions,
      Placeholder.configure({
        placeholder: entryBodyPlaceholder,
        emptyEditorClass: css.emptyEditor,
      }),
    ],
    [entryBodyPlaceholder],
  );

  function updateDirtyState(nextTitle: string, updatedEditor: Editor | null = editor) {
    const dirty =
      entry === undefined ||
      nextTitle !== savedTitle.current ||
      (updatedEditor !== null &&
        savedDocument.current !== null &&
        !updatedEditor.state.doc.eq(savedDocument.current));
    onDraftChange(dirty);
  }

  const editor = useEditor({
    extensions: editorExtensions,
    content: entry?.content ?? "",
    immediatelyRender: false,
    onCreate({ editor: createdEditor }) {
      savedDocument.current = createdEditor.state.doc;
    },
    onUpdate({ editor: updatedEditor }) {
      updateDirtyState(title, updatedEditor);
    },
    editorProps: {
      attributes: {
        "aria-label": t("entryBodyLabel"),
        "aria-multiline": "true",
        class: css.proseMirror,
        role: "textbox",
      },
    },
  });
  function handleSaved(savedEntry: JournalEntry) {
    savedTitle.current = savedEntry.title;
    savedDocument.current = editor?.state.doc ?? savedDocument.current;
    setTitle(savedEntry.title);
    onDraftChange(false);
    onSaved(savedEntry);
  }

  function handleSavingChange(nextSaving: boolean) {
    editor?.setEditable(!nextSaving, false);
    setSaving(nextSaving);
  }

  function handleDocumentPointerDown(event: PointerEvent<HTMLElement>) {
    if (!editor || saving || event.button !== 0) {
      return;
    }

    const target = event.target;
    if (
      target instanceof Element &&
      target.closest("a, button, input, label, [contenteditable='true']")
    ) {
      return;
    }

    event.preventDefault();
    editor.commands.focus("end", { scrollIntoView: false });
  }

  return (
    <Flex
      className={css.shell}
      direction="column"
      flexBasis="0"
      flexGrow="1"
      height="100%"
      minWidth="0"
      overflow="hidden"
      aria-busy={saving}
    >
      <Flex
        className={css.toolbarFrame}
        align="stretch"
        flexShrink="0"
        minWidth="0"
        minHeight="var(--space-8)"
      >
        {!navigationOpen ? (
          <>
            <Flex align="center" px="2" flexShrink="0" display={{ initial: "none", lg: "flex" }}>
              <Tooltip content={tSidebar("showEntries")}>
                <IconButton
                  size="2"
                  variant="ghost"
                  color="gray"
                  aria-label={tSidebar("showEntries")}
                  aria-expanded={false}
                  onClick={onShowNavigation}
                >
                  <ChevronRightIcon aria-hidden />
                </IconButton>
              </Tooltip>
            </Flex>
            <Box asChild display={{ initial: "none", lg: "block" }}>
              <Separator orientation="vertical" size="4" />
            </Box>
          </>
        ) : null}

        <Box flexGrow="1" flexShrink="1" minWidth="0" overflowX="auto">
          <JournalEditorToolbar disabled={saving} editor={editor} />
        </Box>

        <Separator orientation="vertical" size="4" />
        <JournalEditorActions
          draftDirty={draftDirty}
          editor={editor}
          entry={entry}
          onDeleted={onDeleted}
          onSaved={handleSaved}
          onSavingChange={handleSavingChange}
          defaultTitle={defaultTitle}
          title={title}
          user={user}
        />
      </Flex>

      <Box asChild flexGrow="1" minHeight="0" overflowY="auto">
        <div>
          <Flex direction="column" minHeight="100%" minWidth="100%" p={{ initial: "3", sm: "5" }}>
            <Box asChild flexGrow="1">
              <Card asChild size={{ initial: "2", sm: "3" }} variant="surface">
                <article
                  className={css.documentSurface}
                  aria-label={normalizedTitle}
                  onPointerDown={handleDocumentPointerDown}
                >
                  <Flex direction="column" flexGrow="1" width="100%">
                    <JournalEditorDocumentHeader
                      draftDirty={draftDirty}
                      entry={entry}
                      saving={saving}
                      title={title}
                      titlePlaceholder={defaultTitle}
                      onTitleChange={(nextTitle) => {
                        setTitle(nextTitle);
                        updateDirtyState(nextTitle);
                      }}
                      onTitleBlur={() => {
                        if (normalizedTitle !== title) {
                          setTitle(normalizedTitle);
                          updateDirtyState(normalizedTitle);
                        }
                      }}
                      onTitleSubmit={() => editor?.commands.focus("start")}
                    />

                    <div className={css.editorBody}>
                      <EditorContent editor={editor} />
                    </div>
                  </Flex>
                </article>
              </Card>
            </Box>
          </Flex>
        </div>
      </Box>
    </Flex>
  );
}
