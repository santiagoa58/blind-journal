"use client";

import { Box, Flex, Separator } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import type { JournalEntry } from "@/api/journal/journal.type";
import { currentSessionUser } from "@/mocks/current-session.mock";
import { journalEntries as initialEntries } from "../mocks/journal-entries.mock";
import { AppSidebar, type SidebarSection } from "./app-sidebar";
import { EntryList } from "./entry-list";
import { JournalEditor } from "./journal-editor";
import { PrivacySettingsDialog } from "./privacy-settings-dialog";

export function Workspace() {
  const t = useTranslations("journal");
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
      title: t("newEntry.title"),
      preview: t("newEntry.preview"),
      body: "",
      dateLabel: t("newEntry.dateLabel"),
      timeLabel: t("newEntry.timeLabel"),
      updatedAt: t("newEntry.updatedAt"),
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
          currentUser={currentSessionUser}
          onSectionChange={setActiveSection}
          onNewEntry={createEntry}
          onOpenSettings={() => setSettingsOpen(true)}
        />
        <Box asChild display={{ initial: "none", lg: "block" }}>
          <Separator orientation="vertical" size="4" />
        </Box>
        <EntryList entries={entries} selectedId={selectedEntry?.id} onSelect={setSelectedId} />
        <Box asChild display={{ initial: "none", md: "block" }}>
          <Separator orientation="vertical" size="4" />
        </Box>
        {!!selectedEntry && <JournalEditor entry={selectedEntry} onChange={updateSelectedEntry} />}
      </Flex>
      <PrivacySettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
