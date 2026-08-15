import { create } from "zustand";

type JournalWorkspaceState = {
  selectedEntryId: string | undefined;
  draftDirty: boolean;
  draftEntryId: string | undefined;
  draftRevision: number;
  pendingEntryId: string | undefined;
  cancelPendingEntry(): void;
  confirmPendingEntry(): void;
  discardDraft(): void;
  markDraftSaved(revision: number): void;
  reset(): void;
  selectEntry(entryId: string): void;
  updateDraft(entryId: string, dirty: boolean): void;
};

const initialState = {
  draftDirty: false,
  draftEntryId: undefined,
  draftRevision: 0,
  pendingEntryId: undefined,
  selectedEntryId: undefined,
} as const;

function applySelection(state: JournalWorkspaceState, selectedEntryId: string) {
  return {
    selectedEntryId,
    draftDirty: false,
    draftEntryId: undefined,
    draftRevision: state.draftRevision + 1,
    pendingEntryId: undefined,
  };
}

export const useJournalWorkspace = create<JournalWorkspaceState>((set) => ({
  ...initialState,
  cancelPendingEntry: () => set({ pendingEntryId: undefined }),
  confirmPendingEntry: () =>
    set((state) => (state.pendingEntryId ? applySelection(state, state.pendingEntryId) : state)),
  discardDraft: () =>
    set((state) => ({
      draftDirty: false,
      draftEntryId: undefined,
      draftRevision: state.draftRevision + 1,
      pendingEntryId: undefined,
    })),
  markDraftSaved: (revision) =>
    set((state) => {
      if (revision !== state.draftRevision) {
        return state;
      }

      return state.pendingEntryId
        ? applySelection(state, state.pendingEntryId)
        : { draftDirty: false, draftEntryId: undefined };
    }),
  reset: () => set(initialState),
  selectEntry: (selectedEntryId) =>
    set((state) => {
      const currentEntryId = state.draftDirty ? state.draftEntryId : state.selectedEntryId;
      if (selectedEntryId === currentEntryId) {
        return state;
      }

      return state.draftDirty
        ? { pendingEntryId: selectedEntryId }
        : applySelection(state, selectedEntryId);
    }),
  updateDraft: (draftEntryId, draftDirty) =>
    set((state) => ({
      draftDirty,
      draftEntryId: draftDirty ? draftEntryId : undefined,
      draftRevision: state.draftRevision + 1,
    })),
}));
