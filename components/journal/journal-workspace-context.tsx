"use client";

import { createContext, type PropsWithChildren, use, useMemo, useState } from "react";
import type { JournalEntry } from "@/api/journal/journal.type";

export type JournalSection = "journal" | "favorites";

type JournalWorkspaceContextValue = {
  activeSection: JournalSection;
  entries: JournalEntry[];
  favoriteCount: number;
  selectedEntry: JournalEntry | undefined;
  selectEntry: (entryId: string) => void;
  selectSection: (section: JournalSection) => void;
};

const JournalWorkspaceContext = createContext<JournalWorkspaceContextValue | null>(null);

export function JournalWorkspaceProvider({
  children,
  entries,
}: PropsWithChildren<{ entries: JournalEntry[] }>) {
  const [selectedId, setSelectedId] = useState<string>();
  const [activeSection, setActiveSection] = useState<JournalSection>("journal");
  const selectedEntry = entries.find(({ id }) => id === selectedId) ?? entries[0];
  const favoriteCount = entries.filter(({ favorite }) => favorite).length;

  const value = useMemo<JournalWorkspaceContextValue>(
    () => ({
      activeSection,
      entries,
      favoriteCount,
      selectedEntry,
      selectEntry: setSelectedId,
      selectSection(section) {
        setActiveSection(section);

        if (section === "favorites") {
          setSelectedId(entries.find(({ favorite }) => favorite)?.id);
        }
      },
    }),
    [activeSection, entries, favoriteCount, selectedEntry],
  );

  return <JournalWorkspaceContext value={value}>{children}</JournalWorkspaceContext>;
}

export function useJournalWorkspace() {
  return use(JournalWorkspaceContext);
}
