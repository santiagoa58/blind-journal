"use client";

import { AlertDialog, Button, Flex } from "@radix-ui/themes";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import type { ClientUser } from "@/api/auth/user.type";
import { deleteJournalEntry } from "@/api/journal/journal";
import type { JournalEntry } from "@/api/journal/journal.type";
import { useAppToast } from "@/hooks/use-app-toast";
import { journalEntriesQueryKey } from "./journal-query";

type JournalEntryDeleteDialogProps = {
  entry: JournalEntry;
  includesUnsavedChanges: boolean;
  onDeleted: (entryId: string) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  user: ClientUser;
};

export function JournalEntryDeleteDialog({
  entry,
  includesUnsavedChanges,
  onDeleted,
  onOpenChange,
  open,
  user,
}: JournalEntryDeleteDialogProps) {
  const t = useTranslations("journal-editor");
  const tActions = useTranslations("common.actions");
  const tJournal = useTranslations("journal");
  const appToast = useAppToast();
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    gcTime: 0,
    mutationFn: () => deleteJournalEntry(entry.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: journalEntriesQueryKey(user.id) });
      onDeleted(entry.id);
      onOpenChange(false);
      appToast.success(tJournal("success.deleted"));
    },
  });

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!deleteMutation.isPending) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <AlertDialog.Content maxWidth="440px">
        <AlertDialog.Title>{t("deleteDialog.title")}</AlertDialog.Title>
        <AlertDialog.Description size="2">
          {t(
            includesUnsavedChanges
              ? "deleteDialog.descriptionWithUnsavedChanges"
              : "deleteDialog.description",
          )}
        </AlertDialog.Description>
        <Flex gap="3" mt="5" justify="end">
          <AlertDialog.Cancel>
            <Button variant="soft" color="gray" disabled={deleteMutation.isPending}>
              {tActions("cancel")}
            </Button>
          </AlertDialog.Cancel>
          <Button
            color="red"
            autoFocus
            onClick={() =>
              deleteMutation.mutate(undefined, { onSettled: () => deleteMutation.reset() })
            }
            loading={deleteMutation.isPending}
            disabled={deleteMutation.isPending}
          >
            {tActions("delete")}
          </Button>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
