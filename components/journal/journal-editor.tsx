"use client";

import { CheckCircledIcon } from "@radix-ui/react-icons";
import { Badge, Box, Container, Flex, ScrollArea, Separator, Text } from "@radix-ui/themes";
import { type Editor, EditorContent, useEditor } from "@tiptap/react";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import type { ClientUser } from "@/api/auth/user.type";
import { MAX_JOURNAL_ENTRY_TITLE_CHARACTERS } from "@/api/journal/journal.constants";
import type { JournalEntry } from "@/api/journal/journal.type";
import { journalEditorExtensions } from "./journal-editor.config";
import styles from "./journal-editor.module.css";
import { JournalEditorActions } from "./journal-editor-actions";
import { JournalEditorToolbar } from "./journal-editor-toolbar";

const css = styles as Record<
  "editorBody" | "proseMirror" | "shell" | "titleInput" | "toolbarFrame",
  string
>;

type JournalEditorProps = {
  draftDirty: boolean;
  entry: JournalEntry;
  onDeleted: () => void;
  onDraftChange: (dirty: boolean) => void;
  user: ClientUser;
};

export function JournalEditor({
  draftDirty,
  entry,
  onDeleted,
  onDraftChange,
  user,
}: JournalEditorProps) {
  const t = useTranslations("journal-editor");
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const [title, setTitle] = useState(entry.title);
  const [saving, setSaving] = useState(false);
  const savedTitle = useRef(entry.title);
  const savedDocument = useRef<Editor["state"]["doc"] | null>(null);

  function updateDirtyState(nextTitle: string, updatedEditor: Editor | null = editor) {
    const dirty =
      nextTitle !== savedTitle.current ||
      (updatedEditor !== null &&
        savedDocument.current !== null &&
        !updatedEditor.state.doc.eq(savedDocument.current));
    onDraftChange(dirty);
  }

  const editor = useEditor({
    extensions: journalEditorExtensions,
    content: entry.content,
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
  const createdAt = new Date(entry.createdAt);
  const updatedAt = new Date(entry.updatedAt);

  function handleSaved(savedEntry: JournalEntry) {
    savedTitle.current = savedEntry.title;
    savedDocument.current = editor?.state.doc ?? savedDocument.current;
    setTitle(savedEntry.title);
    onDraftChange(false);
  }

  function handleSavingChange(nextSaving: boolean) {
    editor?.setEditable(!nextSaving, false);
    setSaving(nextSaving);
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
          title={title}
          user={user}
        />
      </Flex>

      <Box asChild flexGrow="1" minHeight="0">
        <ScrollArea scrollbars="vertical">
          <Flex minWidth="100%" maxWidth="100%">
            <Container size="2" width="100%">
              <Box asChild minHeight="100%" p={{ initial: "5", sm: "8" }} pb="30vh">
                <article aria-label={title || t("entryTitlePlaceholder")}>
                  <Flex
                    direction={{ initial: "column", xs: "row" }}
                    align={{ initial: "start", xs: "center" }}
                    gap="2"
                    mb="5"
                  >
                    <Badge size="1" variant="soft" color="iris" radius="full">
                      <CheckCircledIcon aria-hidden width={13} height={13} />
                      {t("encryptedOnDevice")}
                    </Badge>
                    <Flex align="center" gap="2">
                      <Text asChild size="1" color="gray">
                        <time dateTime={entry.createdAt}>
                          {format.dateTime(createdAt, { dateStyle: "medium" })}
                        </time>
                      </Text>
                      <Separator aria-hidden orientation="vertical" size="1" />
                      <Text asChild size="1" color="gray">
                        <time dateTime={entry.updatedAt}>
                          {t("lastSaved", {
                            time: format.relativeTime(updatedAt, { now }),
                          })}
                        </time>
                      </Text>
                    </Flex>
                  </Flex>

                  <input
                    type="text"
                    className={css.titleInput}
                    aria-label={t("entryTitleLabel")}
                    value={title}
                    placeholder={t("entryTitlePlaceholder")}
                    maxLength={MAX_JOURNAL_ENTRY_TITLE_CHARACTERS}
                    disabled={saving}
                    onChange={(event) => {
                      const nextTitle = event.target.value;
                      setTitle(nextTitle);
                      updateDirtyState(nextTitle);
                    }}
                    onBlur={() => {
                      const trimmedTitle = title.trim();
                      if (trimmedTitle !== title) {
                        setTitle(trimmedTitle);
                        updateDirtyState(trimmedTitle);
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        editor?.commands.focus("start");
                      }
                    }}
                  />

                  <div className={css.editorBody}>
                    <EditorContent editor={editor} />
                  </div>
                </article>
              </Box>
            </Container>
          </Flex>
        </ScrollArea>
      </Box>
    </Flex>
  );
}
