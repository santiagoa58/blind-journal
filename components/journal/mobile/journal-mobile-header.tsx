import { PlusIcon } from "@radix-ui/react-icons";
import { Box, Button, Flex, Separator } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import type { ClientUser } from "@/api/auth/user.type";
import type { JournalEntry } from "@/api/journal/journal.type";
import { BrandMark } from "@/components/brand-mark";
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

function BrandMarkMobile() {
  return (
    <BrandMark.Root>
      <BrandMark.Avatar />
      <Box asChild display={{ initial: "none", sm: "inline" }}>
        <BrandMark.Name />
      </Box>
    </BrandMark.Root>
  );
}

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
        <Flex align="center" gap={{ initial: "3", sm: "4" }} px={{ initial: "4", sm: "5" }} py="3">
          <Box flexShrink="0">
            <BrandMarkMobile />
          </Box>

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

          <Flex align="center" flexShrink="0">
            <JournalAccountMenu
              compact
              currentUser={currentUser}
              onLocaleChange={onLocaleChange}
              onSignOut={onSignOut}
            />
          </Flex>
        </Flex>
        <Separator size="4" />
      </header>
    </Box>
  );
}
