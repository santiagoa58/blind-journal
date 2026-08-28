"use client";

import { Box, Flex, Heading, Separator, VisuallyHidden } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { useLogout } from "@/hooks/use-logout";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { ClientUser } from "@/lib/api/auth/user.type";
import type { JournalEntry, UnreadableJournalEntry } from "@/lib/api/journal/journal.type";
import { JournalDesktopSidebar } from "./journal-desktop-sidebar";
import { JournalDraftGuard } from "./journal-draft-guard";
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

type PendingIntent =
  | { type: "create" }
  | { type: "locale"; locale: Locale }
  | { type: "logout" }
  | { type: "select"; entryId: string };

export function JournalContent({
  entries,
  hasMoreEntries,
  loadingMoreEntries,
  loadMoreEntries,
  unreadableEntries,
  user,
}: JournalContentProps) {
  const tEntries = useTranslations("entry-list");
  const pathname = usePathname();
  const router = useRouter();
  const [selectedEntryId, setSelectedEntryId] = useState<string>();
  const [draftDirty, setDraftDirty] = useState(false);
  const [editorVersion, setEditorVersion] = useState(0);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [newEntryOpen, setNewEntryOpen] = useState(false);
  const [pendingIntent, setPendingIntent] = useState<PendingIntent | null>(null);
  const [entryPendingDeletion, setEntryPendingDeletion] = useState<JournalEntry>();
  const { signOut } = useLogout();
  const selectedEntry = entries.find(({ id }) => id === selectedEntryId) ?? entries.at(0);
  const effectiveSelectedEntryId = newEntryOpen ? undefined : selectedEntry?.id;

  const executeIntent = useCallback(
    (intent: PendingIntent) => {
      if (intent.type === "select") {
        setNewEntryOpen(false);
        setSelectedEntryId(intent.entryId);
      } else if (intent.type === "create") {
        setNewEntryOpen(true);
        setDraftDirty(true);
      } else if (intent.type === "locale") {
        router.replace(pathname, { locale: intent.locale });
      } else {
        signOut();
      }
    },
    [pathname, router, signOut],
  );

  function requestIntent(intent: PendingIntent) {
    if (intent.type === "select" && intent.entryId === effectiveSelectedEntryId) {
      return;
    }

    if (draftDirty) {
      setPendingIntent(intent);
    } else {
      executeIntent(intent);
    }
  }

  const requestCreate = () => requestIntent({ type: "create" });
  const requestLocaleChange = (nextLocale: Locale) =>
    requestIntent({ type: "locale", locale: nextLocale });
  const requestSignOut = () => requestIntent({ type: "logout" });
  const requestSelection = (entryId: string) => requestIntent({ type: "select", entryId });

  function discardDraftAndContinue() {
    const intent = pendingIntent;
    setPendingIntent(null);
    setDraftDirty(false);
    setEditorVersion((version) => version + 1);
    if (intent) {
      executeIntent(intent);
    }
  }

  return (
    <Flex direction="column" height="100dvh" overflow="hidden">
      <VisuallyHidden asChild>
        <Heading as="h1">{tEntries("title")}</Heading>
      </VisuallyHidden>
      <JournalDraftGuard
        dirty={draftDirty}
        open={pendingIntent !== null}
        onCancel={() => setPendingIntent(null)}
        onDiscard={discardDraftAndContinue}
      />
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
              setDesktopSidebarOpen(true);
              setNewEntryOpen(false);
              setPendingIntent(null);
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
        onLocaleChange={requestLocaleChange}
        onSelectEntry={requestSelection}
        onSignOut={requestSignOut}
        selectedEntryId={effectiveSelectedEntryId}
      />
      <UnreadableEntriesNotice entries={unreadableEntries} />

      <Flex flexGrow="1" minHeight="0" overflow="hidden">
        {desktopSidebarOpen ? (
          <>
            <JournalDesktopSidebar
              currentUser={user}
              entries={entries}
              hasMoreEntries={hasMoreEntries}
              loadingMoreEntries={loadingMoreEntries}
              loadMoreEntries={loadMoreEntries}
              onCollapse={() => setDesktopSidebarOpen(false)}
              onCreateEntry={requestCreate}
              onLocaleChange={requestLocaleChange}
              onDeleteEntry={setEntryPendingDeletion}
              onSelectEntry={requestSelection}
              onSignOut={requestSignOut}
              selectedEntryId={effectiveSelectedEntryId}
            />
            <Box asChild display={{ initial: "none", lg: "block" }}>
              <Separator orientation="vertical" size="4" />
            </Box>
          </>
        ) : null}

        {newEntryOpen || selectedEntry ? (
          <JournalEditor
            key={`${newEntryOpen ? "new" : selectedEntry?.id}:${editorVersion}`}
            draftDirty={draftDirty}
            entry={newEntryOpen ? undefined : selectedEntry}
            navigationOpen={desktopSidebarOpen}
            user={user}
            onDeleteEntry={setEntryPendingDeletion}
            onDraftChange={setDraftDirty}
            onSaved={(savedEntry) => {
              setDraftDirty(false);
              setNewEntryOpen(false);
              setSelectedEntryId(savedEntry.id);
            }}
            onShowNavigation={() => setDesktopSidebarOpen(true)}
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
