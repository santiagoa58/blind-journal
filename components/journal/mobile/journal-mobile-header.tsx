import { PlusIcon } from "@radix-ui/react-icons";
import { Box, Button, Flex, Separator } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import type { ClientUser } from "@/lib/api/auth/user.type";
import type { JournalEntry } from "@/lib/api/journal/journal.type";
import { JournalAccountMenu } from "../journal-account-menu";
import { JournalEntrySelect } from "./journal-entry-select";

type JournalMobileHeaderProps = {
  currentUser: ClientUser;
  entries: JournalEntry[];
  hasMoreEntries: boolean;
  loadingMoreEntries: boolean;
  loadMoreEntries: () => void;
  onCreateEntry: () => void;
  onSelectEntry: (entryId: string) => void;
  onSignOut: () => void;
  selectedEntryId: string | undefined;
};

export function JournalMobileHeader({
  currentUser,
  entries,
  hasMoreEntries,
  loadingMoreEntries,
  loadMoreEntries,
  onCreateEntry,
  onSelectEntry,
  onSignOut,
  selectedEntryId,
}: JournalMobileHeaderProps) {
  const t = useTranslations("sidebar");

  return (
    <Box asChild display={{ initial: "block", lg: "none" }}>
      <header>
        <Flex align="center" gap={{ initial: "3", sm: "4" }} px={{ initial: "4", sm: "5" }} py="3">
          <Box flexGrow="1" minWidth="0">
            <JournalEntrySelect
              entries={entries}
              hasMoreEntries={hasMoreEntries}
              loadingMoreEntries={loadingMoreEntries}
              loadMoreEntries={loadMoreEntries}
              onSelectEntry={onSelectEntry}
              selectedEntryId={selectedEntryId}
            />
          </Box>

          <Box flexShrink="0">
            <Button size="3" variant="surface" onClick={onCreateEntry} aria-label={t("newEntry")}>
              <PlusIcon aria-hidden />
              <Box as="span" display={{ initial: "none", sm: "inline" }}>
                {t("newEntry")}
              </Box>
            </Button>
          </Box>

          <JournalAccountMenu compact currentUser={currentUser} onSignOut={onSignOut} />
        </Flex>
        <Separator size="4" />
      </header>
    </Box>
  );
}
