import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { Box, Flex, Heading, Text, TextField, VisuallyHidden } from "@radix-ui/themes";
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

        <Box mt="4">
          <VisuallyHidden asChild>
            <Text as="label" htmlFor={searchId}>
              {t("searchLabel")}
            </Text>
          </VisuallyHidden>
          <TextField.Root
            id={searchId}
            type="search"
            size="3"
            placeholder={t("searchPlaceholder")}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          >
            <TextField.Slot side="left">
              <MagnifyingGlassIcon aria-hidden width={16} height={16} />
            </TextField.Slot>
            <TextField.Slot side="right" pl="0" pr="3" aria-hidden />
          </TextField.Root>
        </Box>

        <Flex mt="3" justify="end">
          <Text asChild size="1" color="gray">
            <output htmlFor={searchId} aria-live="polite" aria-atomic="true">
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
