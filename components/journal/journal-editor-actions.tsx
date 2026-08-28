"use client";

import { CheckIcon, TrashIcon } from "@radix-ui/react-icons";
import { Box, Button, Flex, IconButton, Tooltip } from "@radix-ui/themes";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Editor } from "@tiptap/react";
import { useTranslations } from "next-intl";
import { useAppToast } from "@/hooks/use-app-toast";
import type { ClientUser } from "@/lib/api/auth/user.type";
import { createJournalEntry, updateJournalEntry } from "@/lib/api/journal/journal";
import type {
  ClientCreateJournalEntryRequest,
  ClientUpdateJournalEntryRequest,
  JournalEntry,
} from "@/lib/api/journal/journal.type";
import { journalEntriesQueryKey } from "./journal-query";

type JournalEditorActionsProps = {
  defaultTitle: string;
  draftDirty: boolean;
  editor: Editor | null;
  entry: JournalEntry | undefined;
  onDeleteEntry: (entry: JournalEntry) => void;
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
  onDeleteEntry,
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

  return (
    <Flex align="center" gap="3" flexShrink="0" px="3">
      <Button
        size="2"
        aria-label={tActions("save")}
        onClick={saveEntry}
        loading={saveMutation.isPending}
        disabled={!editor || (entry !== undefined && !draftDirty) || saveMutation.isPending}
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
            disabled={saveMutation.isPending}
            onClick={() => onDeleteEntry(entry)}
          >
            <TrashIcon aria-hidden width={17} height={17} />
          </IconButton>
        </Tooltip>
      ) : null}
    </Flex>
  );
}
