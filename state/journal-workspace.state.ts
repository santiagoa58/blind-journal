import { create } from "zustand";
import type { JournalEntry } from "@/api/journal/journal.type";

export type JournalSection = "journal" | "favorites";

type JournalWorkspaceState = {
  activeSection: JournalSection;
  selectedEntryId: string | undefined;
  reset(): void;
  selectEntry(entryId: string | undefined): void;
  selectSection(section: JournalSection, entries?: readonly JournalEntry[]): void;
};

const initialState = {
  activeSection: "journal",
  selectedEntryId: undefined,
} as const;

export const useJournalWorkspace = create<JournalWorkspaceState>((set) => ({
  ...initialState,
  reset: () => set(initialState),
  selectEntry: (selectedEntryId) => set({ selectedEntryId }),
  selectSection: (activeSection, entries = []) =>
    set((state) => ({
      activeSection,
      selectedEntryId:
        activeSection === "favorites"
          ? entries.find(({ favorite }) => favorite)?.id
          : state.selectedEntryId,
    })),
}));
