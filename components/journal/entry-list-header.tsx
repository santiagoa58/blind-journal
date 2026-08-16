import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { Box, Flex, Heading, Text, TextField } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import { useId } from "react";

type EntryListHeaderProps = {
  hasMoreEntries: boolean;
  headingId: string;
  onQueryChange: (query: string) => void;
  query: string;
  visibleEntryCount: number;
};

export function EntryListHeader({
  hasMoreEntries,
  headingId,
  onQueryChange,
  query,
  visibleEntryCount,
}: EntryListHeaderProps) {
  const t = useTranslations("entry-list");
  const searchId = useId();

  return (
    <Box asChild p="5" pb="3">
      <header>
        <Box>
          <Text size="1" weight="medium" color="iris">
            {t("eyebrow")}
          </Text>
          <Heading id={headingId} as="h2" size="6" mt="1">
            {t("title")}
          </Heading>
        </Box>

        <TextField.Root
          id={searchId}
          mt="4"
          size="3"
          aria-label={t("searchPlaceholder")}
          placeholder={t("searchPlaceholder")}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        >
          <TextField.Slot>
            <MagnifyingGlassIcon aria-hidden width={16} height={16} />
          </TextField.Slot>
        </TextField.Root>

        <Flex mt="3" justify="end">
          <Text asChild size="1" color="gray">
            <output htmlFor={searchId} aria-live="polite">
              {t(hasMoreEntries ? "loadedEntriesCount" : "entriesCount", {
                count: visibleEntryCount,
              })}
            </output>
          </Text>
        </Flex>
      </header>
    </Box>
  );
}
