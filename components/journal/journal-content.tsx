"use client";

import { Box, Flex, Separator } from "@radix-ui/themes";
import { AppSidebar } from "./app-sidebar";
import { EntryList } from "./entry-list";
import { JournalEditor } from "./journal-editor";
import { JournalEmptyCard } from "./journal-empty-card";
import { JournalMobileHeader } from "./journal-mobile-header";
import { useJournalWorkspace } from "./journal-workspace-context";

export function JournalContent() {
  const workspace = useJournalWorkspace();

  if (!workspace) {
    return null;
  }

  const { selectedEntry } = workspace;

  return (
    <Flex direction="column" height="100dvh" overflow="hidden">
      <JournalMobileHeader />

      <Flex flexGrow="1" minHeight="0" overflow="hidden">
        <AppSidebar />
        <Box asChild display={{ initial: "none", lg: "block" }}>
          <Separator orientation="vertical" size="4" />
        </Box>
        <EntryList />
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
