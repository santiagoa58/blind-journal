"use client";

import { Box, Flex, Separator } from "@radix-ui/themes";
import { useMemo, useState } from "react";

import { JournalEntry } from "@/lib/types/journal.type";
import { journalEntries as initialEntries } from "../mocks/journal-entries.mock";
import { AppSidebar, type SidebarSection } from "./app-sidebar";
import { EntryList } from "./entry-list";
import { JournalEditor } from "./journal-editor";
import { PrivacySettingsDialog } from "./privacy-settings-dialog";

export function Workspace() {
  const [entries, setEntries] = useState(initialEntries);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SidebarSection>("journal");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.id === selectedId) ?? entries[0],
    [entries, selectedId],
  );

  function updateSelectedEntry(nextEntry: JournalEntry) {
    setEntries((current) =>
      current.map((entry) => (entry.id === nextEntry.id ? nextEntry : entry)),
    );
  }

  function createEntry() {
    const nextEntry: JournalEntry = {
      id: `entry-${Date.now()}`,
      title: "Untitled entry",
      preview: "Start writing…",
      body: "",
      dateLabel: "Friday, July 31",
      timeLabel: "Now",
      updatedAt: "New entry",
      favorite: false,
      mood: "reflective",
      tags: [],
      wordCount: 0,
    };

    setEntries((current) => [nextEntry, ...current]);
    setSelectedId(nextEntry.id);
    setActiveSection("journal");
  }

  return (
    <>
      <Flex width="100%" height="100vh" overflow="hidden">
        <AppSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onNewEntry={createEntry}
          onOpenSettings={() => setSettingsOpen(true)}
        />
        <Box asChild display={{ initial: "none", lg: "block" }}>
          <Separator orientation="vertical" size="4" />
        </Box>
        <EntryList
          entries={entries}
          selectedId={selectedEntry?.id}
          onSelect={setSelectedId}
        />
        <Box asChild display={{ initial: "none", md: "block" }}>
          <Separator orientation="vertical" size="4" />
        </Box>
        {!!selectedEntry && (
          <JournalEditor entry={selectedEntry} onChange={updateSelectedEntry} />
        )}
      </Flex>
      <PrivacySettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </>
  );
}
