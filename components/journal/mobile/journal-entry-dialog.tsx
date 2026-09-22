"use client";

import { Cross2Icon, HamburgerMenuIcon } from "@radix-ui/react-icons";
import { Box, Button, Dialog, Flex, IconButton } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { JournalEntry } from "@/lib/api/journal/journal.type";
import { EntryList } from "../entry-list";

type JournalEntryDialogProps = {
  entries: JournalEntry[];
  hasMoreEntries: boolean;
  loadingMoreEntries: boolean;
  loadMoreEntries: () => void;
  onDeleteEntry: (entry: JournalEntry) => void;
  onSelectEntry: (entryId: string) => void;
  selectedEntryId: string | undefined;
};

export function JournalEntryDialog({
  entries,
  hasMoreEntries,
  loadingMoreEntries,
  loadMoreEntries,
  onDeleteEntry,
  onSelectEntry,
  selectedEntryId,
}: JournalEntryDialogProps) {
  const t = useTranslations("entry-list");
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <Button size="3" variant="surface" color="gray" disabled={entries.length === 0}>
          <HamburgerMenuIcon aria-hidden />
          {t("title")}
        </Button>
      </Dialog.Trigger>
      <Box asChild p="0">
        <Dialog.Content maxWidth="440px">
          <Flex justify="between" align="center" gap="3" px="4" pt="4">
            <Dialog.Title mb="0">{t("title")}</Dialog.Title>
            <Dialog.Close>
              <IconButton size="2" variant="ghost" color="gray" aria-label={t("closeEntries")}>
                <Cross2Icon aria-hidden />
              </IconButton>
            </Dialog.Close>
          </Flex>
          <EntryList
            entries={entries}
            hasMoreEntries={hasMoreEntries}
            loadingMoreEntries={loadingMoreEntries}
            loadMoreEntries={loadMoreEntries}
            onDeleteEntry={(entry) => {
              setOpen(false);
              onDeleteEntry(entry);
            }}
            onSelectEntry={(entryId) => {
              setOpen(false);
              onSelectEntry(entryId);
            }}
            selectedEntryId={selectedEntryId}
          />
        </Dialog.Content>
      </Box>
    </Dialog.Root>
  );
}
