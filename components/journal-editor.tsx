"use client";

import type {
  JournalEntry,
  UpdateJournalEntryRequest,
} from "@/api/journal/journal.type";
import {
  CheckCircledIcon,
  DotsHorizontalIcon,
  FontBoldIcon,
  FontItalicIcon,
  HeartFilledIcon,
  HeartIcon,
  ListBulletIcon,
  LockClosedIcon,
  QuoteIcon,
  ResetIcon,
  RowsIcon,
  TrashIcon,
  UpdateIcon,
} from "@radix-ui/react-icons";
import {
  AlertDialog,
  Badge,
  Box,
  Button,
  Card,
  Container,
  DropdownMenu,
  Flex,
  IconButton,
  ScrollArea,
  Separator,
  Text,
  TextArea,
  Tooltip,
} from "@radix-ui/themes";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { useState } from "react";

type JournalEditorProps = {
  entry: JournalEntry;
  deleting: boolean;
  saving: boolean;
  onDelete: () => void;
  onSave: (input: UpdateJournalEntryRequest) => void;
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
  const tJournal = useTranslations("journal");
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const [title, setTitle] = useState(entry.title);
  const [content, setContent] = useState(entry.content);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
    ],
    content: entry.content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        "aria-label": t("entryBodyLabel"),
        "aria-multiline": "true",
        role: "textbox",
      },
    },
    onUpdate({ editor: activeEditor }) {
      setContent(activeEditor.getHTML());
    },
  });
  const editorState = useEditorState({
    editor,
    selector: ({ editor: activeEditor }) => ({
      bold: activeEditor?.isActive("bold") ?? false,
      italic: activeEditor?.isActive("italic") ?? false,
      bulletList: activeEditor?.isActive("bulletList") ?? false,
      orderedList: activeEditor?.isActive("orderedList") ?? false,
      blockquote: activeEditor?.isActive("blockquote") ?? false,
      canUndo: activeEditor?.can().undo() ?? false,
      canRedo: activeEditor?.can().redo() ?? false,
    }),
  });
  const toolbarState = editorState ?? {
    bold: false,
    italic: false,
    bulletList: false,
    orderedList: false,
    blockquote: false,
    canUndo: false,
    canRedo: false,
  };
  const favoriteLabel = entry.favorite
    ? t("removeFromFavorites")
    : t("addToFavorites");
  const createdAt = new Date(entry.createdAt);
  const updatedAt = new Date(entry.updatedAt);

  const formatActions = [
    {
      label: t("formatting.bold"),
      icon: FontBoldIcon,
      active: toolbarState.bold,
      disabled: !editor,
      run: () => editor?.chain().focus().toggleBold().run(),
    },
    {
      label: t("formatting.italic"),
      icon: FontItalicIcon,
      active: toolbarState.italic,
      disabled: !editor,
      run: () => editor?.chain().focus().toggleItalic().run(),
    },
    {
      label: t("formatting.bulletedList"),
      icon: ListBulletIcon,
      active: toolbarState.bulletList,
      disabled: !editor,
      run: () => editor?.chain().focus().toggleBulletList().run(),
    },
    {
      label: t("formatting.numberedList"),
      icon: RowsIcon,
      active: toolbarState.orderedList,
      disabled: !editor,
      run: () => editor?.chain().focus().toggleOrderedList().run(),
    },
    {
      label: t("formatting.quote"),
      icon: QuoteIcon,
      active: toolbarState.blockquote,
      disabled: !editor,
      run: () => editor?.chain().focus().toggleBlockquote().run(),
    },
    {
      label: t("formatting.undo"),
      icon: ResetIcon,
      active: false,
      disabled: !toolbarState.canUndo,
      run: () => editor?.chain().focus().undo().run(),
    },
    {
      label: t("formatting.redo"),
      icon: UpdateIcon,
      active: false,
      disabled: !toolbarState.canRedo,
      run: () => editor?.chain().focus().redo().run(),
    },
  ];

  return (
    <AlertDialog.Root
      open={deleteDialogOpen}
      onOpenChange={setDeleteDialogOpen}
    >
      <Flex asChild direction="column" height="100%" minWidth="0" flexGrow="1">
        <main>
          <Flex
            align="center"
            justify="between"
            gap="3"
            px={{ initial: "4", sm: "5" }}
            py="3"
          >
            <Flex align="center" gap="2" minWidth="0">
              <Badge size="2" variant="surface" color="iris">
                <CheckCircledIcon aria-hidden width={14} height={14} />
                {t("encryptedOnDevice")}
              </Badge>
              <Tooltip content={t("privateEntry")}>
                <IconButton
                  variant="ghost"
                  color="gray"
                  aria-label={t("encryptionDetails")}
                >
                  <LockClosedIcon aria-hidden width={16} height={16} />
                </IconButton>
              </Tooltip>
            </Flex>

            <Flex align="center" gap="2">
              <Tooltip content={favoriteLabel}>
                <IconButton
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
                onClick={() => onSave({ title, content })}
                loading={saving}
                disabled={saving || title.trim().length === 0}
              >
                {tCommon("actions.save")}
              </Button>

              <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                  <IconButton
                    variant="ghost"
                    color="gray"
                    aria-label={t("entryActions")}
                  >
                    <DotsHorizontalIcon aria-hidden width={17} height={17} />
                  </IconButton>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end">
                  <DropdownMenu.Item
                    color="red"
                    onSelect={() => setDeleteDialogOpen(true)}
                  >
                    <TrashIcon aria-hidden width={15} height={15} />
                    {t("deleteEntry")}
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </Flex>
          </Flex>

          <Separator size="4" />

          <Flex
            align="center"
            gap="1"
            px={{ initial: "4", sm: "5" }}
            py="2"
            wrap="wrap"
          >
            {formatActions.map(
              ({ label, icon: Icon, active, disabled, run }) => (
                <Tooltip key={label} content={label}>
                  <IconButton
                    variant={active ? "soft" : "ghost"}
                    color={active ? "iris" : "gray"}
                    aria-label={label}
                    aria-pressed={active}
                    disabled={disabled}
                    onClick={run}
                  >
                    <Icon aria-hidden width={16} height={16} />
                  </IconButton>
                </Tooltip>
              ),
            )}
          </Flex>

          <Separator size="4" />

          <Flex asChild flexGrow="1" minHeight="0">
            <ScrollArea scrollbars="vertical">
              <Container
                size="2"
                px={{ initial: "5", sm: "7", lg: "8" }}
                py={{ initial: "6", sm: "8" }}
              >
                <Flex wrap="wrap" align="center" gap="2">
                  <Text size="1" color="gray">
                    {format.dateTime(createdAt, { dateStyle: "full" })}
                  </Text>
                  <Text size="1" color="gray" aria-hidden>
                    ·
                  </Text>
                  <Text size="1" color="gray">
                    {format.dateTime(createdAt, {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </Text>
                  <Text size="1" color="gray" aria-hidden>
                    ·
                  </Text>
                  <Badge size="1" variant="soft" color="gray">
                    {tJournal(`moods.${entry.mood}`)}
                  </Badge>
                </Flex>

                <TextArea
                  aria-label={t("entryTitleLabel")}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  mt="4"
                  size="3"
                  variant="soft"
                  resize="none"
                  rows={2}
                />

                <Card
                  mt="4"
                  size="3"
                  variant="surface"
                  onClick={() => editor?.chain().focus().run()}
                >
                  <Box asChild minHeight="320px">
                    <Text asChild size="3">
                      <EditorContent editor={editor} />
                    </Text>
                  </Box>
                </Card>

                <Flex wrap="wrap" gap="2" mt="5">
                  {entry.tags.map((tag) => (
                    <Badge key={tag} size="2" variant="soft" color="iris">
                      #{tag}
                    </Badge>
                  ))}
                </Flex>
              </Container>
            </ScrollArea>
          </Flex>

          <Separator size="4" />
          <Flex
            align="center"
            justify="between"
            px={{ initial: "4", sm: "5" }}
            py="2"
          >
            <Text size="1" color="gray">
              {t("lastSaved", {
                time: format.relativeTime(updatedAt, { now }),
              })}
            </Text>
            <Text size="1" color="gray">
              {t("wordsCount", { count: entry.wordCount })}
            </Text>
          </Flex>

          <AlertDialog.Content maxWidth="440px">
            <AlertDialog.Title>{t("deleteDialog.title")}</AlertDialog.Title>
            <AlertDialog.Description size="2">
              {t("deleteDialog.description")}
            </AlertDialog.Description>
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
        </main>
      </Flex>
    </AlertDialog.Root>
  );
}
