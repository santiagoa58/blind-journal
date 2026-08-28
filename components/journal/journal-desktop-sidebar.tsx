"use client";

import { ChevronLeftIcon, PlusIcon } from "@radix-ui/react-icons";
import { Box, Button, Flex, IconButton, Separator, Tooltip } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import { BrandMark } from "@/components/brand-mark";
import type { Locale } from "@/i18n/routing";
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
  onCollapse: () => void;
  onCreateEntry: () => void;
  onLocaleChange: (locale: Locale) => void;
  onDeleteEntry: (entry: JournalEntry) => void;
  onSelectEntry: (entryId: string) => void;
  onSignOut: () => void;
  selectedEntryId: string | undefined;
};

function Brand() {
  return (
    <BrandMark.Root>
      <BrandMark.Avatar />
      <BrandMark.Name />
    </BrandMark.Root>
  );
}

export function JournalDesktopSidebar({
  currentUser,
  entries,
  hasMoreEntries,
  loadingMoreEntries,
  loadMoreEntries,
  onCollapse,
  onCreateEntry,
  onLocaleChange,
  onDeleteEntry,
  onSelectEntry,
  onSignOut,
  selectedEntryId,
}: JournalDesktopSidebarProps) {
  const t = useTranslations("sidebar");

  return (
    <Flex
      asChild
      direction="column"
      width="360px"
      height="100%"
      flexShrink="0"
      display={{ initial: "none", lg: "flex" }}
    >
      <aside aria-label={t("journalNavigationLabel")}>
        <Flex direction="column" gap="4" p="4" pb="0">
          <Flex align="center" justify="between" gap="3">
            <Brand />
            {entries.length > 0 ? (
              <Tooltip content={t("hideEntries")}>
                <IconButton
                  size="2"
                  variant="ghost"
                  color="gray"
                  aria-label={t("hideEntries")}
                  aria-expanded={true}
                  onClick={onCollapse}
                >
                  <ChevronLeftIcon aria-hidden />
                </IconButton>
              </Tooltip>
            ) : null}
          </Flex>
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
          <JournalAccountMenu
            currentUser={currentUser}
            onLocaleChange={onLocaleChange}
            onSignOut={onSignOut}
          />
        </Box>
      </aside>
    </Flex>
  );
}
