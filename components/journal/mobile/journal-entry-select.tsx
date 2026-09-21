"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import {
  Box,
  Button,
  Dialog,
  Flex,
  IconButton,
  RadioCards,
  ScrollArea,
  Text,
} from "@radix-ui/themes";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import type { JournalEntry } from "@/lib/api/journal/journal.type";

type JournalEntrySelectProps = {
  entries: JournalEntry[];
  hasMoreEntries: boolean;
  loadingMoreEntries: boolean;
  loadMoreEntries: () => void;
  onSelectEntry: (entryId: string) => void;
  selectedEntryId: string | undefined;
};

export function JournalEntrySelect({
  entries,
  hasMoreEntries,
  loadingMoreEntries,
  loadMoreEntries,
  onSelectEntry,
  selectedEntryId,
}: JournalEntrySelectProps) {
  const t = useTranslations("entry-list");
  const format = useFormatter();
  const [open, setOpen] = useState(false);
  const selectedEntry = entries.find((entry) => entry.id === selectedEntryId);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <Box asChild width="100%" minWidth="0">
          <Button
            size="3"
            variant="surface"
            color="gray"
            disabled={entries.length === 0}
            aria-label={t("openPicker")}
          >
            <Text truncate>{selectedEntry?.title ?? t("title")}</Text>
          </Button>
        </Box>
      </Dialog.Trigger>
      <Dialog.Content maxWidth="460px">
        <Flex justify="between" align="start" gap="3">
          <Box>
            <Dialog.Title>{t("title")}</Dialog.Title>
            <Dialog.Description>{t("pickerDescription")}</Dialog.Description>
          </Box>
          <Dialog.Close>
            <IconButton size="3" variant="ghost" color="gray" aria-label={t("closePicker")}>
              <Cross2Icon aria-hidden />
            </IconButton>
          </Dialog.Close>
        </Flex>
        <Box asChild height="60dvh" maxHeight="560px" mt="4">
          <ScrollArea scrollbars="vertical">
            <RadioCards.Root
              value={selectedEntryId ?? ""}
              onValueChange={(entryId) => {
                setOpen(false);
                onSelectEntry(entryId);
              }}
              columns="1"
              gap="2"
              size="2"
              variant="surface"
              aria-label={t("sectionLabel")}
            >
              {entries.map((entry) => (
                <RadioCards.Item
                  key={entry.id}
                  value={entry.id}
                  aria-label={t("openEntryLabel", { title: entry.title })}
                >
                  <Flex direction="column" align="start" gap="1" width="100%" minWidth="0">
                    <Text as="span" weight="medium" wrap="wrap">
                      {entry.title}
                    </Text>
                    <Text as="span" size="1" color="gray">
                      {format.dateTime(new Date(entry.updatedAt), { dateStyle: "medium" })}
                    </Text>
                  </Flex>
                </RadioCards.Item>
              ))}
            </RadioCards.Root>
            {hasMoreEntries ? (
              <Box p="2">
                <Button
                  variant="soft"
                  loading={loadingMoreEntries}
                  disabled={loadingMoreEntries}
                  onClick={loadMoreEntries}
                >
                  {t("loadMore")}
                </Button>
              </Box>
            ) : null}
          </ScrollArea>
        </Box>
      </Dialog.Content>
    </Dialog.Root>
  );
}
