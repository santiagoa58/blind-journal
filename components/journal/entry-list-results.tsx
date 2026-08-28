import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { Avatar, Button, Flex, RadioCards, ScrollArea, Text } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import { EntryListItem } from "@/components/journal/entry-list-item";
import type { JournalEntry } from "@/lib/api/journal/journal.type";

type EntryListResultsProps = {
  entries: JournalEntry[];
  hasMoreEntries: boolean;
  loadingMoreEntries: boolean;
  loadMoreEntries: () => void;
  onDeleteEntry: (entry: JournalEntry) => void;
  onSelectEntry: (entryId: string) => void;
  selectedEntryId: string | undefined;
};

export function EntryListResults({
  entries,
  hasMoreEntries,
  loadingMoreEntries,
  loadMoreEntries,
  onDeleteEntry,
  onSelectEntry,
  selectedEntryId,
}: EntryListResultsProps) {
  const t = useTranslations("entry-list");

  return (
    <Flex asChild flexGrow="1" minHeight="0">
      <ScrollArea scrollbars="vertical">
        <Flex direction="column" gap="2" p="3" pt="1" minWidth="100%" maxWidth="100%">
          <RadioCards.Root
            aria-label={t("sectionLabel")}
            value={selectedEntryId ?? ""}
            onValueChange={onSelectEntry}
            columns="1"
            gap="2"
            size="2"
            variant="surface"
          >
            {entries.map((entry) => (
              <EntryListItem
                key={entry.id}
                entry={entry}
                onDeleteEntry={onDeleteEntry}
                selected={entry.id === selectedEntryId}
              />
            ))}
          </RadioCards.Root>

          {entries.length === 0 ? (
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
