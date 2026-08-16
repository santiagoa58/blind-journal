"use client";

import { ExitIcon, HamburgerMenuIcon, PlusIcon } from "@radix-ui/react-icons";
import {
  Box,
  Button,
  Dialog,
  Flex,
  Grid,
  IconButton,
  Select,
  Text,
  Tooltip,
} from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import type { ClientUser } from "@/api/auth/user.type";
import type { JournalEntry } from "@/api/journal/journal.type";
import { BrandMark } from "@/components/brand-mark";

type JournalMobileHeaderProps = {
  creatingEntry: boolean;
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
  creatingEntry,
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
  const tEntries = useTranslations("entry-list");
  const selectedEntry = entries.find(({ id }) => id === selectedEntryId) ?? entries[0];

  return (
    <Box asChild display={{ initial: "block", lg: "none" }}>
      <header>
        <Flex align="center" gap="3" px="4" py="3">
          <Dialog.Root>
            <Dialog.Trigger>
              <IconButton variant="ghost" color="gray" aria-label={t("journalNavigationLabel")}>
                <HamburgerMenuIcon aria-hidden />
              </IconButton>
            </Dialog.Trigger>
            <Dialog.Content maxWidth="360px">
              <BrandMark />
              <Dialog.Title mt="5">{t("journalNavigationLabel")}</Dialog.Title>
              <Dialog.Description size="2" color="gray">
                {currentUser.displayName}
              </Dialog.Description>

              <Flex direction="column" gap="2" mt="5">
                <Dialog.Close>
                  <Button variant="ghost" color="red" onClick={onSignOut}>
                    <Grid columns="auto 1fr" align="center" gap="2" width="100%">
                      <ExitIcon aria-hidden />
                      <Text align="left">{t("account.signOut")}</Text>
                    </Grid>
                  </Button>
                </Dialog.Close>
              </Flex>
            </Dialog.Content>
          </Dialog.Root>

          <Select.Root value={selectedEntry?.id ?? ""} onValueChange={onSelectEntry}>
            <Box
              asChild
              flexGrow="1"
              width="0"
              minWidth="0"
              maxWidth="100%"
              display={{ initial: "block", md: "none" }}
            >
              <Select.Trigger
                aria-label={tEntries("sectionLabel")}
                placeholder={tEntries("title")}
              />
            </Box>
            <Select.Content>
              {entries.map((entry) => (
                <Select.Item key={entry.id} value={entry.id}>
                  {entry.title}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>

          {hasMoreEntries ? (
            <Box asChild display={{ initial: "block", md: "none" }}>
              <Button
                size="1"
                variant="soft"
                loading={loadingMoreEntries}
                disabled={loadingMoreEntries}
                onClick={loadMoreEntries}
              >
                {tEntries("loadMore")}
              </Button>
            </Box>
          ) : null}

          <Tooltip content={t("newEntry")}>
            <IconButton
              onClick={onCreateEntry}
              aria-label={t("newEntry")}
              loading={creatingEntry}
              disabled={creatingEntry}
              ml={{ initial: "0", md: "auto" }}
            >
              <PlusIcon aria-hidden />
            </IconButton>
          </Tooltip>
        </Flex>
      </header>
    </Box>
  );
}
