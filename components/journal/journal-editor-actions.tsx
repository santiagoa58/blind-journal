"use client";

import { CheckIcon, DotsHorizontalIcon, TrashIcon } from "@radix-ui/react-icons";
import { AlertDialog, Box, Button, DropdownMenu, Flex, IconButton } from "@radix-ui/themes";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Editor } from "@tiptap/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ClientUser } from "@/api/auth/user.type";
import { deleteJournalEntry, updateJournalEntry } from "@/api/journal/journal";
import type { ClientUpdateJournalEntryRequest, JournalEntry } from "@/api/journal/journal.type";
import { useAppToast } from "@/hooks/use-app-toast";
import { isCurrentClientSession } from "@/hooks/use-client-session";
import { journalEntriesQueryKey } from "./journal-query";

type JournalEditorActionsProps = {
  draftDirty: boolean;
  editor: Editor | null;
  entry: JournalEntry;
  onDeleted: () => void;
  onSaved: (entry: JournalEntry) => void;
  onSavingChange: (saving: boolean) => void;
  title: string;
  user: ClientUser;
};

export function JournalEditorActions({
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
    mutationFn: (input: ClientUpdateJournalEntryRequest) => updateJournalEntry(input, user),
    onSuccess: async (savedEntry) => {
      if (!isCurrentClientSession(user)) {
        return;
      }

      await queryClient.invalidateQueries({ queryKey: journalEntriesQueryKey(user.id) });

      if (!isCurrentClientSession(user)) {
        return;
      }

      onSaved(savedEntry);
      appToast.success(tJournal("success.saved"));
    },
    onSettled: () => {
      onSavingChange(false);
    },
  });
  const deleteMutation = useMutation({
    gcTime: 0,
    mutationFn: () => deleteJournalEntry(entry.id),
    onSuccess: async () => {
      if (!isCurrentClientSession(user)) {
        return;
      }

      await queryClient.invalidateQueries({ queryKey: journalEntriesQueryKey(user.id) });

      if (!isCurrentClientSession(user)) {
        return;
      }

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
    saveMutation.mutate(
      {
        id: entry.id,
        title: title.trim(),
        content: editor.getHTML(),
      },
      { onSettled: () => saveMutation.reset() },
    );
  }

  function deleteEntry() {
    deleteMutation.mutate(undefined, { onSettled: () => deleteMutation.reset() });
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
          disabled={!editor || !draftDirty || writeDisabled || title.trim().length === 0}
        >
          <CheckIcon aria-hidden width={16} height={16} />
          <Box asChild display={{ initial: "none", sm: "inline" }}>
            <span>{tActions("save")}</span>
          </Box>
        </Button>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <IconButton
              size="2"
              variant="ghost"
              color="gray"
              aria-label={t("entryActions")}
              disabled={writeDisabled}
            >
              <DotsHorizontalIcon aria-hidden width={17} height={17} />
            </IconButton>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end">
            <DropdownMenu.Item
              color="red"
              onSelect={() => setDeleteDialogOpen(true)}
              disabled={writeDisabled}
            >
              <TrashIcon aria-hidden width={15} height={15} />
              {t("deleteEntry")}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
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
