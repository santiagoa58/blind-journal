"use client";

import { PlusIcon } from "@radix-ui/react-icons";
import { Box, Button, Flex, Heading, Separator } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import type { ClientUser } from "@/lib/api/auth/user.type";
import type { JournalEntry } from "@/lib/api/journal/journal.type";
import { EntryList } from "./entry-list";
import { JournalAccountMenu } from "./journal-account-menu";

type JournalDesktopSidebarProps = {
  currentUser: ClientUser;
  entries: JournalEntry[];
  hasMoreEntries: boolean;
  loadingMoreEntries: boolean;
  loadMoreEntries: () => void;
  onCreateEntry: () => void;
  onDeleteEntry: (entry: JournalEntry) => void;
  onSelectEntry: (entryId: string) => void;
  onSignOut: () => void;
  selectedEntryId: string | undefined;
};

export function JournalDesktopSidebar({
  currentUser,
  entries,
  hasMoreEntries,
  loadingMoreEntries,
  loadMoreEntries,
  onCreateEntry,
  onDeleteEntry,
  onSelectEntry,
  onSignOut,
  selectedEntryId,
}: JournalDesktopSidebarProps) {
  const t = useTranslations("sidebar");
  const tEntries = useTranslations("entry-list");

  return (
    <Flex
      asChild
      direction="column"
      width="320px"
      height="100%"
      flexShrink="0"
      display={{ initial: "none", lg: "flex" }}
    >
      <aside aria-label={t("journalNavigationLabel")}>
        <Flex direction="column" gap="3" p="4" pb="0">
          <Heading as="h2" size="4">
            {tEntries("title")}
          </Heading>
          <Button size="3" variant="surface" onClick={onCreateEntry}>
            <PlusIcon aria-hidden />
            {t("newEntry")}
          </Button>
        </Flex>

        <EntryList
          entries={entries}
          hasMoreEntries={hasMoreEntries}
          loadingMoreEntries={loadingMoreEntries}
          loadMoreEntries={loadMoreEntries}
          onDeleteEntry={onDeleteEntry}
          onSelectEntry={onSelectEntry}
          selectedEntryId={selectedEntryId}
        />

        <Box px="3" pb="3">
          <Separator size="4" mb="3" />
          <JournalAccountMenu currentUser={currentUser} onSignOut={onSignOut} />
        </Box>
      </aside>
    </Flex>
  );
}
