import { PlusIcon } from "@radix-ui/react-icons";
import { Box, Button, Container, Flex, Separator } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import type { ClientUser } from "@/api/auth/user.type";
import type { JournalEntry } from "@/api/journal/journal.type";
import type { Locale } from "@/i18n/routing";
import { JournalAccountMenu } from "../journal-account-menu";
import { JournalEntrySelect } from "./journal-entry-select";

type JournalMobileHeaderProps = {
  currentUser: ClientUser;
  entries: JournalEntry[];
  hasMoreEntries: boolean;
  loadingMoreEntries: boolean;
  loadMoreEntries: () => void;
  onCreateEntry: () => void;
  onLocaleChange: (locale: Locale) => void;
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
  onLocaleChange,
  onSelectEntry,
  onSignOut,
  selectedEntryId,
}: JournalMobileHeaderProps) {
  const t = useTranslations("sidebar");

  return (
    <Box asChild display={{ initial: "block", lg: "none" }}>
      <header>
        <Flex align="start" gap="2" px="3" py="2">
          <JournalAccountMenu
            compact
            currentUser={currentUser}
            onLocaleChange={onLocaleChange}
            onSignOut={onSignOut}
          />

          <Box flexGrow="1" minWidth="0">
            <Container size="2">
              <JournalEntrySelect
                entries={entries}
                hasMoreEntries={hasMoreEntries}
                loadingMoreEntries={loadingMoreEntries}
                loadMoreEntries={loadMoreEntries}
                onSelectEntry={onSelectEntry}
                selectedEntryId={selectedEntryId}
              />
            </Container>
          </Box>

          <Button size="3" onClick={onCreateEntry} aria-label={t("newEntry")}>
            <PlusIcon aria-hidden />
            <Box as="span" display={{ initial: "none", sm: "inline" }}>
              {t("newEntry")}
            </Box>
          </Button>
        </Flex>
        <Separator size="4" />
      </header>
    </Box>
  );
}
