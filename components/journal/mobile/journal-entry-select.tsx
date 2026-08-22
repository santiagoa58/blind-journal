import { Box, Button, Flex, Select } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import type { JournalEntry } from "@/api/journal/journal.type";

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

  return (
    <Flex direction="column" gap="2" flexGrow="1" minWidth="0">
      <Select.Root
        size="3"
        value={selectedEntryId ?? ""}
        onValueChange={onSelectEntry}
        disabled={entries.length === 0}
      >
        <Box asChild width="100%" minWidth="0">
          <Select.Trigger
            variant="soft"
            radius="large"
            aria-label={t("sectionLabel")}
            placeholder={t("title")}
          />
        </Box>
        <Select.Content position="popper" align="start">
          <Select.Group>
            <Select.Label>{t("title")}</Select.Label>
            {entries.map((entry) => (
              <Select.Item key={entry.id} value={entry.id}>
                {entry.title}
              </Select.Item>
            ))}
          </Select.Group>
        </Select.Content>
      </Select.Root>

      {hasMoreEntries ? (
        <Box asChild width="100%">
          <Button
            size="1"
            variant="soft"
            color="gray"
            loading={loadingMoreEntries}
            disabled={loadingMoreEntries}
            onClick={loadMoreEntries}
          >
            {t("loadMore")}
          </Button>
        </Box>
      ) : null}
    </Flex>
  );
}
