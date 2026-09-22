"use client";

import { Box, Flex, Separator } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { useNavigationBlocker } from "@/components/navigation-blocker";
import { useLogout } from "@/hooks/use-logout";
import type { ClientUser } from "@/lib/api/auth/user.type";
import type { JournalEntry, UnreadableJournalEntry } from "@/lib/api/journal/journal.type";
import { JournalDesktopSidebar } from "./journal-desktop-sidebar";
import { JournalEditor } from "./journal-editor";
import { JournalEmptyCard } from "./journal-empty-card";
import { JournalEntryDeleteDialog } from "./journal-entry-delete-dialog";
import { JournalMobileHeader } from "./mobile/journal-mobile-header";
import { UnreadableEntriesNotice } from "./unreadable-entries-notice";

type JournalContentProps = {
  entries: JournalEntry[];
  hasMoreEntries: boolean;
  loadingMoreEntries: boolean;
  loadMoreEntries: () => void;
  unreadableEntries: UnreadableJournalEntry[];
  user: ClientUser;
};

export function JournalContent({
  entries,
  hasMoreEntries,
  loadingMoreEntries,
  loadMoreEntries,
  unreadableEntries,
  user,
}: JournalContentProps) {
  const [selectedEntryId, setSelectedEntryId] = useState<string>();
  const [draftDirty, setDraftDirty] = useState(false);
  const [editorVersion, setEditorVersion] = useState(0);
  const [newEntryOpen, setNewEntryOpen] = useState(false);
  const [entryPendingDeletion, setEntryPendingDeletion] = useState<JournalEntry>();
  const { run, setBlocked } = useNavigationBlocker();
  const { signOut } = useLogout();
  const selectedEntry = entries.find(({ id }) => id === selectedEntryId) ?? entries.at(0);
  const effectiveSelectedEntryId = newEntryOpen ? undefined : selectedEntry?.id;

  useEffect(() => {
    setBlocked(draftDirty);
  }, [draftDirty, setBlocked]);

  useEffect(
    () => () => {
      setBlocked(false);
    },
    [setBlocked],
  );

  function requestCreate() {
    run(() => {
      setEditorVersion((version) => version + 1);
      setNewEntryOpen(true);
      setSelectedEntryId(undefined);
      setDraftDirty(true);
    });
  }

  function requestSelection(entryId: string) {
    if (entryId === effectiveSelectedEntryId) {
      return;
    }

    run(() => {
      setDraftDirty(false);
      setEditorVersion((version) => version + 1);
      setNewEntryOpen(false);
      setSelectedEntryId(entryId);
    });
  }

  function requestSignOut() {
    run(signOut);
  }

  return (
    <Flex direction="column" flexGrow="1" minHeight="0" overflow="hidden">
      {entryPendingDeletion ? (
        <JournalEntryDeleteDialog
          entry={entryPendingDeletion}
          includesUnsavedChanges={
            draftDirty && entryPendingDeletion.id === effectiveSelectedEntryId
          }
          open
          user={user}
          onOpenChange={(open) => {
            if (!open) {
              setEntryPendingDeletion(undefined);
            }
          }}
          onDeleted={(entryId) => {
            if (entryId === effectiveSelectedEntryId) {
              setDraftDirty(false);
              setNewEntryOpen(false);
              setSelectedEntryId(undefined);
            }
          }}
        />
      ) : null}

      <JournalMobileHeader
        currentUser={user}
        entries={entries}
        hasMoreEntries={hasMoreEntries}
        loadingMoreEntries={loadingMoreEntries}
        loadMoreEntries={loadMoreEntries}
        onCreateEntry={requestCreate}
        onDeleteEntry={setEntryPendingDeletion}
        onSelectEntry={requestSelection}
        onSignOut={requestSignOut}
        selectedEntryId={effectiveSelectedEntryId}
      />
      <UnreadableEntriesNotice entries={unreadableEntries} />

      <Flex flexGrow="1" minHeight="0" overflow="hidden">
        <JournalDesktopSidebar
          currentUser={user}
          entries={entries}
          hasMoreEntries={hasMoreEntries}
          loadingMoreEntries={loadingMoreEntries}
          loadMoreEntries={loadMoreEntries}
          onCreateEntry={requestCreate}
          onDeleteEntry={setEntryPendingDeletion}
          onSelectEntry={requestSelection}
          onSignOut={requestSignOut}
          selectedEntryId={effectiveSelectedEntryId}
        />
        <Box asChild display={{ initial: "none", lg: "block" }}>
          <Separator orientation="vertical" size="4" />
        </Box>

        {newEntryOpen || selectedEntry ? (
          <JournalEditor
            key={`${newEntryOpen ? "new" : selectedEntry?.id}:${editorVersion}`}
            draftDirty={draftDirty}
            entry={newEntryOpen ? undefined : selectedEntry}
            user={user}
            onDeleteEntry={setEntryPendingDeletion}
            onDraftChange={setDraftDirty}
            onSaved={(savedEntry) => {
              setDraftDirty(false);
              setNewEntryOpen(false);
              setSelectedEntryId(savedEntry.id);
            }}
          />
        ) : (
          <Flex align="center" justify="center" flexGrow="1" p="5">
            <JournalEmptyCard onCreateEntry={requestCreate} />
          </Flex>
        )}
      </Flex>
    </Flex>
  );
}
