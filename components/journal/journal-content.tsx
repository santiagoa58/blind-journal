"use client";

import { Box, Flex, Separator } from "@radix-ui/themes";
import type { JournalEntry, UnreadableJournalEntry } from "@/api/journal/journal.type";
import { useJournalWorkspace } from "@/state/journal-workspace.state";
import { AppSidebar } from "./app-sidebar";
import { EntryList } from "./entry-list";
import { JournalEditor } from "./journal-editor";
import { JournalEmptyCard } from "./journal-empty-card";
import { JournalMobileHeader } from "./journal-mobile-header";
import { UnreadableEntriesNotice } from "./unreadable-entries-notice";

type JournalContentProps = {
  entries: JournalEntry[];
  unreadableEntries: UnreadableJournalEntry[];
};

export function JournalContent({ entries, unreadableEntries }: JournalContentProps) {
  const activeSection = useJournalWorkspace((state) => state.activeSection);
  const selectedEntryId = useJournalWorkspace((state) => state.selectedEntryId);
  const sectionEntries =
    activeSection === "favorites" ? entries.filter(({ favorite }) => favorite) : entries;
  const selectedEntry =
    sectionEntries.find(({ id }) => id === selectedEntryId) ?? sectionEntries[0];

  // TODO(review-medium-main-landmark): Give the journal route one stable `main` landmark whether an
  // entry is selected or the empty state is shown, and make the editor a section/article within it.
  // The current landmark appears only because JournalEditor renders `<main>`.
  return (
    <Flex direction="column" height="100dvh" overflow="hidden">
      <JournalMobileHeader entries={entries} />
      <UnreadableEntriesNotice entries={unreadableEntries} />

      <Flex flexGrow="1" minHeight="0" overflow="hidden">
        <AppSidebar entries={entries} />
        <Box asChild display={{ initial: "none", lg: "block" }}>
          <Separator orientation="vertical" size="4" />
        </Box>
        <EntryList entries={entries} />
        <Box asChild display={{ initial: "none", md: "block" }}>
          <Separator orientation="vertical" size="4" />
        </Box>

        {selectedEntry ? (
          <JournalEditor key={selectedEntry.id} entry={selectedEntry} />
        ) : (
          <Flex align="center" justify="center" flexGrow="1" p="5">
            <JournalEmptyCard />
          </Flex>
        )}
      </Flex>
    </Flex>
  );
}
