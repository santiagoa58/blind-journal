"use client";

import { CheckCircledIcon } from "@radix-ui/react-icons";
import { Badge, Flex, ScrollArea, Separator, Text } from "@radix-ui/themes";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { useState } from "react";
import { MAX_JOURNAL_ENTRY_TITLE_CHARACTERS } from "@/api/journal/journal.constants";
import type { JournalEntry } from "@/api/journal/journal.type";
import styles from "./journal-editor.module.css";
import { JournalEditorActions } from "./journal-editor-actions";
import { JournalEditorToolbar } from "./journal-editor-toolbar";

const css = styles as Record<
  | "canvas"
  | "document"
  | "editorBody"
  | "proseMirror"
  | "shell"
  | "titleInput"
  | "toolbarFrame"
  | "toolbarScroller",
  string
>;

type JournalEditorProps = {
  entry: JournalEntry;
};

export function JournalEditor({ entry }: JournalEditorProps) {
  const t = useTranslations("journal-editor");
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const [title, setTitle] = useState(entry.title);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [1, 2, 3] },
        horizontalRule: false,
        link: false,
      }),
    ],
    content: entry.content,
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
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

  return (
    <main className={css.shell}>
      <header className={css.toolbarFrame}>
        <div className={css.toolbarScroller}>
          <JournalEditorToolbar editor={editor} />
        </div>

        <JournalEditorActions editor={editor} entry={entry} title={title} />
      </header>

      <ScrollArea className={css.canvas} scrollbars="vertical">
        <article className={css.document}>
          <Flex align="center" gap="2" mb="5" wrap="wrap">
            <Badge size="1" variant="soft" color="iris" radius="full">
              <CheckCircledIcon aria-hidden width={13} height={13} />
              {t("encryptedOnDevice")}
            </Badge>
            <Text size="1" color="gray">
              {format.dateTime(createdAt, { dateStyle: "medium" })}
            </Text>
            <Separator orientation="vertical" size="1" />
            <Text size="1" color="gray">
              {t("lastSaved", {
                time: format.relativeTime(updatedAt, { now }),
              })}
            </Text>
          </Flex>

          <textarea
            className={css.titleInput}
            aria-label={t("entryTitleLabel")}
            value={title}
            maxLength={MAX_JOURNAL_ENTRY_TITLE_CHARACTERS}
            placeholder={t("entryTitlePlaceholder")}
            rows={1}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={() => setTitle((currentTitle) => currentTitle.trim())}
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
      </ScrollArea>
    </main>
  );
}
