"use client";

import { Flex } from "@radix-ui/themes";
import { useId, useState } from "react";
import type { JournalEntry } from "@/api/journal/journal.type";
import { EntryListHeader } from "@/components/journal/entry-list-header";
import { EntryListResults } from "@/components/journal/entry-list-results";

type EntryListProps = {
  entries: JournalEntry[];
  hasMoreEntries: boolean;
  loadingMoreEntries: boolean;
  loadMoreEntries: () => void;
  onSelectEntry: (entryId: string) => void;
  selectedEntryId: string | undefined;
};

export function EntryList({
  entries,
  hasMoreEntries,
  loadingMoreEntries,
  loadMoreEntries,
  onSelectEntry,
  selectedEntryId,
}: EntryListProps) {
  const headingId = useId();
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const visibleEntries = entries.filter(
    (entry) => normalizedQuery.length === 0 || entry.title.toLowerCase().includes(normalizedQuery),
  );

  return (
    <Flex
      asChild
      direction="column"
      width="360px"
      height="100%"
      flexShrink="0"
      display={{ initial: "none", md: "flex" }}
    >
      <section aria-labelledby={headingId}>
        <EntryListHeader
          headingId={headingId}
          query={query}
          onQueryChange={setQuery}
          visibleEntryCount={visibleEntries.length}
          hasMoreEntries={hasMoreEntries}
        />
        <EntryListResults
          entries={visibleEntries}
          hasMoreEntries={hasMoreEntries}
          loadingMoreEntries={loadingMoreEntries}
          loadMoreEntries={loadMoreEntries}
          onSelectEntry={onSelectEntry}
          selectedEntryId={selectedEntryId}
        />
      </section>
    </Flex>
  );
}
