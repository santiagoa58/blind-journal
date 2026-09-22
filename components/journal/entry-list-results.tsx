import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { Avatar, Button, Flex, ScrollArea, Text } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import { EntryListItem } from "@/components/journal/entry-list-item";
import type { JournalEntry } from "@/lib/api/journal/journal.type";

type EntryListResultsProps = {
  entries: JournalEntry[];
  hasQuery: boolean;
  hasMoreEntries: boolean;
  loadingMoreEntries: boolean;
  loadMoreEntries: () => void;
  onDeleteEntry: (entry: JournalEntry) => void;
  onSelectEntry: (entryId: string) => void;
  selectedEntryId: string | undefined;
};

export function EntryListResults({
  entries,
  hasQuery,
  hasMoreEntries,
  loadingMoreEntries,
  loadMoreEntries,
  onDeleteEntry,
  onSelectEntry,
  selectedEntryId,
}: EntryListResultsProps) {
  const t = useTranslations("entry-list");

  return (
    <Flex asChild flexGrow="1" minHeight="0" maxHeight={{ initial: "55dvh", lg: "none" }}>
      <ScrollArea scrollbars="vertical">
        <Flex direction="column" gap="1" px="3" pb="3" minWidth="100%" maxWidth="100%">
          {entries.map((entry) => (
            <EntryListItem
              key={entry.id}
              entry={entry}
              onDeleteEntry={onDeleteEntry}
              onSelectEntry={onSelectEntry}
              selected={entry.id === selectedEntryId}
            />
          ))}

          {hasQuery && entries.length === 0 ? (
            <Flex direction="column" align="center" justify="center" py="9" px="5">
              <Avatar
                size="3"
                color="gray"
                variant="soft"
                fallback={<MagnifyingGlassIcon aria-hidden />}
              />
              <Text as="p" size="2" weight="medium" mt="3">
                {t("emptyTitle")}
              </Text>
              <Text as="p" size="1" color="gray" mt="1" align="center">
                {t(hasMoreEntries ? "emptyLoadedDescription" : "emptyDescription")}
              </Text>
            </Flex>
          ) : null}

          {hasMoreEntries ? (
            <Button
              variant="soft"
              loading={loadingMoreEntries}
              disabled={loadingMoreEntries}
              onClick={loadMoreEntries}
            >
              {t("loadMore")}
            </Button>
          ) : null}
        </Flex>
      </ScrollArea>
    </Flex>
  );
}
