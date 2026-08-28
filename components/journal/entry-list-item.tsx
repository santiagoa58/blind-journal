import { CheckCircledIcon, TrashIcon } from "@radix-ui/react-icons";
import { Box, ContextMenu, Flex, RadioCards, Separator, Text } from "@radix-ui/themes";
import { useFormatter, useTranslations } from "next-intl";
import type { JournalEntry } from "@/lib/api/journal/journal.type";

type EntryListItemProps = {
  entry: JournalEntry;
  onDeleteEntry: (entry: JournalEntry) => void;
  selected: boolean;
};

export function EntryListItem({ entry, onDeleteEntry, selected }: EntryListItemProps) {
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
              <Flex as="span" align="center" justify="between" gap="3" width="100%">
                <Flex as="span" direction="column" align="start" gap="2" flexGrow="1" minWidth="0">
                  <Box asChild minWidth="0" maxWidth="100%">
                    <Text size="2" weight="bold" truncate align="left">
                      {entry.title}
                    </Text>
                  </Box>

                  <Flex as="span" align="center" gap="2">
                    <Text asChild size="1" color="gray">
                      <time dateTime={entry.updatedAt}>
                        {format.dateTime(updatedAt, {
                          month: "short",
                          day: "numeric",
                        })}
                      </time>
                    </Text>
                    <Separator aria-hidden orientation="vertical" size="1" />
                    <Text asChild size="1" color="gray">
                      <time dateTime={entry.updatedAt}>
                        {format.dateTime(updatedAt, {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </time>
                    </Text>
                  </Flex>
                </Flex>

                {selected ? (
                  <Text asChild color="iris" size="3">
                    <CheckCircledIcon aria-hidden />
                  </Text>
                ) : null}
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
