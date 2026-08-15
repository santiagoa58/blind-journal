import { afterEach, describe, expect, it } from "vitest";
import { useJournalWorkspace } from "@/state/journal-workspace.state";

const firstEntryId = "entry-one";
const secondEntryId = "entry-two";

afterEach(() => {
  useJournalWorkspace.getState().reset();
});

describe("journal workspace state", () => {
  it("clears workspace state when reset", () => {
    useJournalWorkspace.getState().selectEntry(firstEntryId);
    useJournalWorkspace.getState().reset();

    expect(useJournalWorkspace.getState()).toMatchObject({
      draftDirty: false,
      pendingEntryId: undefined,
      selectedEntryId: undefined,
    });
  });

  it("blocks an entry switch until the dirty draft is explicitly discarded", () => {
    const workspace = useJournalWorkspace.getState();
    workspace.selectEntry(firstEntryId);
    workspace.updateDraft(firstEntryId, true);
    workspace.selectEntry(secondEntryId);

    expect(useJournalWorkspace.getState()).toMatchObject({
      draftDirty: true,
      selectedEntryId: firstEntryId,
      pendingEntryId: secondEntryId,
    });

    useJournalWorkspace.getState().confirmPendingEntry();

    expect(useJournalWorkspace.getState()).toMatchObject({
      draftDirty: false,
      pendingEntryId: undefined,
      selectedEntryId: secondEntryId,
    });
  });

  it("keeps the current draft when a blocked switch is canceled", () => {
    const workspace = useJournalWorkspace.getState();
    workspace.selectEntry(firstEntryId);
    workspace.updateDraft(firstEntryId, true);
    workspace.selectEntry(secondEntryId);
    useJournalWorkspace.getState().cancelPendingEntry();

    expect(useJournalWorkspace.getState()).toMatchObject({
      draftDirty: true,
      pendingEntryId: undefined,
      selectedEntryId: firstEntryId,
    });
  });

  it("does not let a late save mark newer edits as saved", () => {
    const workspace = useJournalWorkspace.getState();
    workspace.updateDraft(firstEntryId, true);
    const savedRevision = useJournalWorkspace.getState().draftRevision;
    workspace.updateDraft(firstEntryId, true);
    workspace.markDraftSaved(savedRevision);

    expect(useJournalWorkspace.getState().draftDirty).toBe(true);

    const currentRevision = useJournalWorkspace.getState().draftRevision;
    workspace.markDraftSaved(currentRevision);
    expect(useJournalWorkspace.getState().draftDirty).toBe(false);
  });

  it("continues a blocked switch when its exact draft revision is saved", () => {
    const workspace = useJournalWorkspace.getState();
    workspace.selectEntry(firstEntryId);
    workspace.updateDraft(firstEntryId, true);
    const savedRevision = useJournalWorkspace.getState().draftRevision;
    workspace.selectEntry(secondEntryId);
    workspace.markDraftSaved(savedRevision);

    expect(useJournalWorkspace.getState()).toMatchObject({
      draftDirty: false,
      pendingEntryId: undefined,
      selectedEntryId: secondEntryId,
    });
  });
});
