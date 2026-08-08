"use client";

import {
  CheckCircledIcon,
  CheckIcon,
  DotsHorizontalIcon,
  HeartFilledIcon,
  HeartIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import {
  AlertDialog,
  Badge,
  Button,
  DropdownMenu,
  Flex,
  IconButton,
  ScrollArea,
  Separator,
  Text,
  Tooltip,
} from "@radix-ui/themes";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { useState } from "react";
import { MAX_JOURNAL_ENTRY_TITLE_CHARACTERS } from "@/api/journal/journal.constants";
import type { ClientUpdateJournalEntryRequest, JournalEntry } from "@/api/journal/journal.type";
import styles from "./journal-editor.module.css";
import { JournalEditorToolbar } from "./journal-editor-toolbar";

const css = styles as Record<
  | "canvas"
  | "document"
  | "editorBody"
  | "proseMirror"
  | "shell"
  | "titleInput"
  | "toolbarActions"
  | "toolbarFrame"
  | "toolbarScroller",
  string
>;

type JournalEditorProps = {
  entry: JournalEntry;
  deleting: boolean;
  saving: boolean;
  onDelete: () => void;
  onSave: (input: ClientUpdateJournalEntryRequest) => void;
  onToggleFavorite: () => void;
};

export function JournalEditor({
  entry,
  deleting,
  saving,
  onDelete,
  onSave,
  onToggleFavorite,
}: JournalEditorProps) {
  const t = useTranslations("journal-editor");
  const tCommon = useTranslations("common");
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const [title, setTitle] = useState(entry.title);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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
  const favoriteLabel = entry.favorite ? t("removeFromFavorites") : t("addToFavorites");
  const createdAt = new Date(entry.createdAt);
  const updatedAt = new Date(entry.updatedAt);

  function saveEntry() {
    onSave({
      id: entry.id,
      title: title.trim(),
      content: editor?.getHTML() ?? entry.content,
      favorite: entry.favorite,
      tags: entry.tags,
    });
  }

  return (
    <AlertDialog.Root open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <main className={css.shell}>
        <header className={css.toolbarFrame}>
          <div className={css.toolbarScroller}>
            <JournalEditorToolbar editor={editor} />
          </div>

          <Flex className={css.toolbarActions} align="center" gap="3" px="3">
            <Tooltip content={favoriteLabel}>
              <IconButton
                size="2"
                variant={entry.favorite ? "soft" : "ghost"}
                color={entry.favorite ? "iris" : "gray"}
                onClick={onToggleFavorite}
                aria-label={favoriteLabel}
              >
                {entry.favorite ? (
                  <HeartFilledIcon aria-hidden width={16} height={16} />
                ) : (
                  <HeartIcon aria-hidden width={16} height={16} />
                )}
              </IconButton>
            </Tooltip>

            <Button
              size="2"
              onClick={saveEntry}
              loading={saving}
              disabled={!editor || saving || title.trim().length === 0}
            >
              <CheckIcon aria-hidden width={16} height={16} />
              {tCommon("actions.save")}
            </Button>

            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <IconButton size="2" variant="ghost" color="gray" aria-label={t("entryActions")}>
                  <DotsHorizontalIcon aria-hidden width={17} height={17} />
                </IconButton>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="end">
                <DropdownMenu.Item color="red" onSelect={() => setDeleteDialogOpen(true)}>
                  <TrashIcon aria-hidden width={15} height={15} />
                  {t("deleteEntry")}
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </Flex>
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

      <AlertDialog.Content maxWidth="440px">
        <AlertDialog.Title>{t("deleteDialog.title")}</AlertDialog.Title>
        <AlertDialog.Description size="2">{t("deleteDialog.description")}</AlertDialog.Description>
        <Flex gap="3" mt="5" justify="end">
          <AlertDialog.Cancel>
            <Button variant="soft" color="gray">
              {tCommon("actions.cancel")}
            </Button>
          </AlertDialog.Cancel>
          <AlertDialog.Action>
            <Button color="red" onClick={onDelete} loading={deleting}>
              {tCommon("actions.delete")}
            </Button>
          </AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
