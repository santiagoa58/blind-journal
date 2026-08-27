"use client";

import { CheckIcon, TrashIcon } from "@radix-ui/react-icons";
import { AlertDialog, Box, Button, Flex, IconButton, Tooltip } from "@radix-ui/themes";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Editor } from "@tiptap/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ClientUser } from "@/api/auth/user.type";
import { createJournalEntry, deleteJournalEntry, updateJournalEntry } from "@/api/journal/journal";
import type {
  ClientCreateJournalEntryRequest,
  ClientUpdateJournalEntryRequest,
  JournalEntry,
} from "@/api/journal/journal.type";
import { useAppToast } from "@/hooks/use-app-toast";
import { journalEntriesQueryKey } from "./journal-query";

type JournalEditorActionsProps = {
  defaultTitle: string;
  draftDirty: boolean;
  editor: Editor | null;
  entry: JournalEntry | undefined;
  onDeleted: () => void;
  onSaved: (entry: JournalEntry) => void;
  onSavingChange: (saving: boolean) => void;
  title: string;
  user: ClientUser;
};

export function JournalEditorActions({
  defaultTitle,
  draftDirty,
  editor,
  entry,
  onDeleted,
  onSaved,
  onSavingChange,
  title,
  user,
}: JournalEditorActionsProps) {
  const t = useTranslations("journal-editor");
  const tJournal = useTranslations("journal");
  const tActions = useTranslations("common.actions");
  const queryClient = useQueryClient();
  const appToast = useAppToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const saveMutation = useMutation({
    gcTime: 0,
    mutationFn: (input: ClientCreateJournalEntryRequest | ClientUpdateJournalEntryRequest) =>
      "id" in input ? updateJournalEntry(input, user) : createJournalEntry(input, user),
    onSuccess: async (savedEntry) => {
      await queryClient.invalidateQueries({ queryKey: journalEntriesQueryKey(user.id) });
      onSaved(savedEntry);
      appToast.success(tJournal(entry ? "success.saved" : "success.created"));
    },
    onSettled: () => {
      onSavingChange(false);
    },
  });
  const deleteMutation = useMutation({
    gcTime: 0,
    mutationFn: (entryId: string) => deleteJournalEntry(entryId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: journalEntriesQueryKey(user.id) });
      onDeleted();
      setDeleteDialogOpen(false);
      appToast.success(tJournal("success.deleted"));
    },
  });
  const writeDisabled = saveMutation.isPending || deleteMutation.isPending;

  function saveEntry() {
    if (!editor) {
      return;
    }

    onSavingChange(true);
    const content = {
      title: title.trim() || defaultTitle,
      content: editor.getHTML(),
    };
    const input = entry ? { id: entry.id, ...content } : content;
    saveMutation.mutate(input, { onSettled: () => saveMutation.reset() });
  }

  function deleteEntry() {
    if (entry) {
      deleteMutation.mutate(entry.id, { onSettled: () => deleteMutation.reset() });
    }
  }

  return (
    <AlertDialog.Root
      open={deleteDialogOpen}
      onOpenChange={(open) => {
        if (!writeDisabled) {
          setDeleteDialogOpen(open);
        }
      }}
    >
      <Flex align="center" gap="3" flexShrink="0" px="3">
        <Button
          size="2"
          aria-label={tActions("save")}
          onClick={saveEntry}
          loading={saveMutation.isPending}
          disabled={!editor || (entry !== undefined && !draftDirty) || writeDisabled}
        >
          <CheckIcon aria-hidden width={16} height={16} />
          <Box as="span" display={{ initial: "none", sm: "inline" }}>
            {tActions("save")}
          </Box>
        </Button>

        {entry ? (
          <Tooltip content={t("deleteEntry")}>
            <IconButton
              size="2"
              variant="ghost"
              color="red"
              aria-label={t("deleteEntry")}
              disabled={writeDisabled}
              onClick={() => setDeleteDialogOpen(true)}
            >
              <TrashIcon aria-hidden width={17} height={17} />
            </IconButton>
          </Tooltip>
        ) : null}
      </Flex>

      <AlertDialog.Content maxWidth="440px">
        <AlertDialog.Title>{t("deleteDialog.title")}</AlertDialog.Title>
        <AlertDialog.Description size="2">
          {t(
            draftDirty ? "deleteDialog.descriptionWithUnsavedChanges" : "deleteDialog.description",
          )}
        </AlertDialog.Description>
        <Flex gap="3" mt="5" justify="end">
          <AlertDialog.Cancel>
            <Button variant="soft" color="gray" disabled={writeDisabled}>
              {tActions("cancel")}
            </Button>
          </AlertDialog.Cancel>
          <Button
            color="red"
            onClick={deleteEntry}
            loading={deleteMutation.isPending}
            disabled={writeDisabled}
          >
            {tActions("delete")}
          </Button>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
