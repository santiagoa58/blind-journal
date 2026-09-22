import { FileTextIcon, TrashIcon } from "@radix-ui/react-icons";
import { Box, ContextMenu, Flex, RadioCards, Text } from "@radix-ui/themes";
import { useFormatter, useTranslations } from "next-intl";
import type { JournalEntry } from "@/lib/api/journal/journal.type";

type EntryListItemProps = {
  entry: JournalEntry;
  onDeleteEntry: (entry: JournalEntry) => void;
};

export function EntryListItem({ entry, onDeleteEntry }: EntryListItemProps) {
  const format = useFormatter();
  const t = useTranslations("entry-list");
  const updatedAt = new Date(entry.updatedAt);

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>
        <Box as="span" width="100%" minWidth="0">
          <Box asChild width="100%" minWidth="0">
            <RadioCards.Item
              value={entry.id}
              aria-label={t("openEntryLabel", { title: entry.title })}
            >
              <Flex as="span" align="start" gap="3" width="100%" minWidth="0">
                <Text asChild color="gray" mt="1">
                  <FileTextIcon aria-hidden width="16" height="16" />
                </Text>
                <Flex as="span" direction="column" align="start" gap="1" flexGrow="1" minWidth="0">
                  <Text as="span" size="2" weight="medium" wrap="wrap" align="left">
                    {entry.title}
                  </Text>
                  <Text asChild size="1" color="gray">
                    <time dateTime={entry.updatedAt}>
                      {format.dateTime(updatedAt, { dateStyle: "medium" })}
                    </time>
                  </Text>
                </Flex>
              </Flex>
            </RadioCards.Item>
          </Box>
        </Box>
      </ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Item color="red" onSelect={() => onDeleteEntry(entry)}>
          <TrashIcon aria-hidden width={15} height={15} />
          {t("deleteEntry")}
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  );
}
