import { Box, Card, Flex, Separator, Text } from "@radix-ui/themes";
import { useFormatter, useTranslations } from "next-intl";
import type { JournalEntry } from "@/api/journal/journal.type";

type EntryListItemProps = {
  entry: JournalEntry;
  onSelect: (entryId: string) => void;
  selected: boolean;
};

export function EntryListItem({ entry, onSelect, selected }: EntryListItemProps) {
  const format = useFormatter();
  const t = useTranslations("entry-list");
  const updatedAt = new Date(entry.updatedAt);

  return (
    <li>
      <Box asChild width="100%" minWidth="0">
        <Card asChild size="2" variant={selected ? "classic" : "ghost"}>
          <button
            type="button"
            onClick={() => onSelect(entry.id)}
            aria-label={t("openEntryLabel", { title: entry.title })}
            aria-current={selected ? "true" : undefined}
          >
            <Flex asChild direction="column" gap="2">
              <span>
                <Box asChild minWidth="0">
                  <span>
                    <Text size="2" weight="bold" truncate align="left">
                      {entry.title}
                    </Text>
                  </span>
                </Box>

                <Flex asChild align="center" gap="2">
                  <span>
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
                  </span>
                </Flex>
              </span>
            </Flex>
          </button>
        </Card>
      </Box>
    </li>
  );
}
