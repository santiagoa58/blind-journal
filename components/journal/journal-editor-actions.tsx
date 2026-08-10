"use client";

import {
  CheckIcon,
  DotsHorizontalIcon,
  HeartFilledIcon,
  HeartIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import { AlertDialog, Button, DropdownMenu, Flex, IconButton, Tooltip } from "@radix-ui/themes";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Editor } from "@tiptap/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { deleteJournalEntry, updateJournalEntry } from "@/api/journal/journal";
import type { JournalEntry } from "@/api/journal/journal.type";
import { useAppToast } from "@/hooks/use-app-toast";
import { useUser } from "@/state/user.state";
import styles from "./journal-editor.module.css";
import { journalEntriesQueryKey } from "./journal-query";

const css = styles as Record<"toolbarActions", string>;

type JournalEditorActionsProps = {
  editor: Editor | null;
  entry: JournalEntry;
  title: string;
};

export function JournalEditorActions({ editor, entry, title }: JournalEditorActionsProps) {
  const user = useUser((state) => state.user);
  const t = useTranslations("journal-editor");
  const tJournal = useTranslations("journal");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();
  const appToast = useAppToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const updateMutation = useMutation({
    mutationKey: ["journal", "save", entry.id],
    mutationFn: (input: Parameters<typeof updateJournalEntry>[0]) =>
      updateJournalEntry(input, user),
  });
  const deleteMutation = useMutation({
    mutationKey: ["journal", "delete", entry.id],
    mutationFn: () => deleteJournalEntry(entry.id),
  });
  const favoriteLabel = entry.favorite ? t("removeFromFavorites") : t("addToFavorites");

  async function updateEntry(favorite: boolean) {
    try {
      const updatedEntry = await updateMutation.mutateAsync({
        id: entry.id,
        title: title.trim(),
        content: editor?.getHTML() ?? entry.content,
        favorite,
        tags: entry.tags,
      });
      queryClient.setQueryData<JournalEntry[]>(journalEntriesQueryKey, (entries) =>
        entries
          ?.map((currentEntry) =>
            currentEntry.id === updatedEntry.id ? updatedEntry : currentEntry,
          )
          .toSorted((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
      );
      appToast.success(tJournal("success.saved"));
    } catch {
      // The shared MutationCache presents the localized error.
    }
  }

  async function deleteEntry() {
    try {
      const deletedEntry = await deleteMutation.mutateAsync();
      queryClient.setQueryData<JournalEntry[]>(journalEntriesQueryKey, (entries) =>
        entries?.filter(({ id }) => id !== deletedEntry.id),
      );
      appToast.success(tJournal("success.deleted"));
    } catch {
      // The shared MutationCache presents the localized error.
    }
  }

  return (
    <AlertDialog.Root open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <Flex className={css.toolbarActions} align="center" gap="3" px="3">
        <Tooltip content={favoriteLabel}>
          <IconButton
            size="2"
            variant={entry.favorite ? "soft" : "ghost"}
            color={entry.favorite ? "iris" : "gray"}
            onClick={() => updateEntry(!entry.favorite)}
            disabled={updateMutation.isPending}
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
          onClick={() => updateEntry(entry.favorite)}
          loading={updateMutation.isPending}
          disabled={!editor || updateMutation.isPending || title.trim().length === 0}
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
            <Button color="red" onClick={deleteEntry} loading={deleteMutation.isPending}>
              {tCommon("actions.delete")}
            </Button>
          </AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
