import { afterEach, describe, expect, it } from "vitest";
import type { JournalEntry } from "@/api/journal/journal.type";
import { useJournalWorkspace } from "@/state/journal-workspace.state";

const firstEntry = {
  id: "entry-one",
  title: "First entry",
  content: "",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  favorite: false,
  tags: [],
} satisfies JournalEntry;

const favoriteEntry = {
  id: "entry-two",
  title: "Favorite entry",
  content: "",
  createdAt: "2026-01-02T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
  favorite: true,
  tags: [],
} satisfies JournalEntry;

const entries = [firstEntry, favoriteEntry] as const;

afterEach(() => {
  useJournalWorkspace.getState().reset();
});

describe("journal workspace state", () => {
  it("selects the first favorite when the favorites section opens", () => {
    useJournalWorkspace.getState().selectEntry(firstEntry.id);
    useJournalWorkspace.getState().selectSection("favorites", entries);

    expect(useJournalWorkspace.getState()).toMatchObject({
      activeSection: "favorites",
      selectedEntryId: favoriteEntry.id,
    });
  });

  it("preserves the selection when returning to the full journal", () => {
    useJournalWorkspace.getState().selectEntry(favoriteEntry.id);
    useJournalWorkspace.getState().selectSection("journal", entries);

    expect(useJournalWorkspace.getState()).toMatchObject({
      activeSection: "journal",
      selectedEntryId: favoriteEntry.id,
    });
  });

  it("clears workspace state when reset", () => {
    useJournalWorkspace.getState().selectSection("favorites", entries);
    useJournalWorkspace.getState().reset();

    expect(useJournalWorkspace.getState()).toMatchObject({
      activeSection: "journal",
      selectedEntryId: undefined,
    });
  });
});
