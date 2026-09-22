import { FileTextIcon, TrashIcon } from "@radix-ui/react-icons";
import { Box, Card, ContextMenu, Flex, Text } from "@radix-ui/themes";
import { useFormatter, useTranslations } from "next-intl";
import type { JournalEntry } from "@/lib/api/journal/journal.type";

type EntryListItemProps = {
  entry: JournalEntry;
  onDeleteEntry: (entry: JournalEntry) => void;
  onSelectEntry: (entryId: string) => void;
  selected: boolean;
};

export function EntryListItem({
  entry,
  onDeleteEntry,
  onSelectEntry,
  selected,
}: EntryListItemProps) {
  const format = useFormatter();
  const t = useTranslations("entry-list");
  const updatedAt = new Date(entry.updatedAt);

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>
        <Box asChild width="100%">
          <Card asChild size="1" variant={selected ? "surface" : "ghost"}>
            <button
              type="button"
              aria-current={selected ? "page" : undefined}
              aria-label={t("openEntryLabel", { title: entry.title })}
              onClick={() => onSelectEntry(entry.id)}
            >
              <Flex align="start" gap="3" width="100%" minWidth="0">
                <Text asChild color={selected ? "iris" : "gray"} mt="1">
                  <FileTextIcon aria-hidden width="16" height="16" />
                </Text>
                <Flex direction="column" align="start" gap="1" flexGrow="1" minWidth="0">
                  <Text
                    size="2"
                    weight="medium"
                    color={selected ? "iris" : undefined}
                    wrap="wrap"
                    align="left"
                  >
                    {entry.title}
                  </Text>
                  <Text asChild size="1" color="gray">
                    <time dateTime={entry.updatedAt}>
                      {format.dateTime(updatedAt, { dateStyle: "medium" })}
                    </time>
                  </Text>
                </Flex>
              </Flex>
            </button>
          </Card>
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
