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
} satisfies JournalEntry;

const favoriteEntry = {
  id: "entry-two",
  title: "Favorite entry",
  content: "",
  createdAt: "2026-01-02T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
  favorite: true,
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
      draftDirty: false,
      pendingSelection: undefined,
      selectedEntryId: undefined,
    });
  });

  it("blocks an entry switch until the dirty draft is explicitly discarded", () => {
    const workspace = useJournalWorkspace.getState();
    workspace.selectEntry(firstEntry.id);
    workspace.updateDraft(firstEntry.id, true);
    workspace.selectEntry(favoriteEntry.id);

    expect(useJournalWorkspace.getState()).toMatchObject({
      draftDirty: true,
      selectedEntryId: firstEntry.id,
      pendingSelection: {
        activeSection: "journal",
        selectedEntryId: favoriteEntry.id,
      },
    });

    useJournalWorkspace.getState().confirmPendingSelection();

    expect(useJournalWorkspace.getState()).toMatchObject({
      draftDirty: false,
      pendingSelection: undefined,
      selectedEntryId: favoriteEntry.id,
    });
  });

  it("keeps the current draft when a blocked switch is canceled", () => {
    const workspace = useJournalWorkspace.getState();
    workspace.selectEntry(firstEntry.id);
    workspace.updateDraft(firstEntry.id, true);
    workspace.selectEntry(favoriteEntry.id);
    useJournalWorkspace.getState().cancelPendingSelection();

    expect(useJournalWorkspace.getState()).toMatchObject({
      draftDirty: true,
      pendingSelection: undefined,
      selectedEntryId: firstEntry.id,
    });
  });

  it("allows section changes that keep the same editor open", () => {
    const workspace = useJournalWorkspace.getState();
    workspace.selectEntry(favoriteEntry.id);
    workspace.updateDraft(favoriteEntry.id, true);
    workspace.selectSection("favorites", entries);

    expect(useJournalWorkspace.getState()).toMatchObject({
      activeSection: "favorites",
      draftDirty: true,
      pendingSelection: undefined,
      selectedEntryId: favoriteEntry.id,
    });
  });

  it("blocks a section change when it would replace a dirty editor", () => {
    const workspace = useJournalWorkspace.getState();
    workspace.selectEntry(firstEntry.id);
    workspace.updateDraft(firstEntry.id, true);
    workspace.selectSection("favorites", entries);

    expect(useJournalWorkspace.getState()).toMatchObject({
      activeSection: "journal",
      draftDirty: true,
      pendingSelection: {
        activeSection: "favorites",
        selectedEntryId: favoriteEntry.id,
      },
      selectedEntryId: firstEntry.id,
    });
  });

  it("does not let a late save mark newer edits as saved", () => {
    const workspace = useJournalWorkspace.getState();
    workspace.updateDraft(firstEntry.id, true);
    const savedRevision = useJournalWorkspace.getState().draftRevision;
    workspace.updateDraft(firstEntry.id, true);
    workspace.markDraftSaved(savedRevision);

    expect(useJournalWorkspace.getState().draftDirty).toBe(true);

    const currentRevision = useJournalWorkspace.getState().draftRevision;
    workspace.markDraftSaved(currentRevision);
    expect(useJournalWorkspace.getState().draftDirty).toBe(false);
  });

  it("continues a blocked switch when its exact draft revision is saved", () => {
    const workspace = useJournalWorkspace.getState();
    workspace.selectEntry(firstEntry.id);
    workspace.updateDraft(firstEntry.id, true);
    const savedRevision = useJournalWorkspace.getState().draftRevision;
    workspace.selectEntry(favoriteEntry.id);
    workspace.markDraftSaved(savedRevision);

    expect(useJournalWorkspace.getState()).toMatchObject({
      draftDirty: false,
      pendingSelection: undefined,
      selectedEntryId: favoriteEntry.id,
    });
  });
});
