import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { Box, Flex, Text, TextField, VisuallyHidden } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import { useId } from "react";

type EntryListHeaderProps = {
  hasMoreEntries: boolean;
  onQueryChange: (query: string) => void;
  query: string;
  visibleEntryCount: number;
};

export function EntryListHeader({
  hasMoreEntries,
  onQueryChange,
  query,
  visibleEntryCount,
}: EntryListHeaderProps) {
  const t = useTranslations("entry-list");
  const searchId = useId();

  return (
    <Box asChild px="4" pt="4" pb="2">
      <header>
        <Box>
          <VisuallyHidden asChild>
            <Text as="label" htmlFor={searchId}>
              {t(hasMoreEntries ? "searchLoadedLabel" : "searchLabel")}
            </Text>
          </VisuallyHidden>
          <TextField.Root
            id={searchId}
            type="search"
            size="3"
            placeholder={t(hasMoreEntries ? "searchLoadedPlaceholder" : "searchPlaceholder")}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          >
            <TextField.Slot side="left">
              <MagnifyingGlassIcon aria-hidden width={16} height={16} />
            </TextField.Slot>
            <TextField.Slot side="right" pl="0" pr="3" aria-hidden />
          </TextField.Root>
        </Box>

        <Flex mt="2" justify="end">
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
