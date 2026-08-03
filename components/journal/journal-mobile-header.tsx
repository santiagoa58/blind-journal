"use client";

import type { User } from "@/api/auth/user.type";
import type { JournalEntry } from "@/api/journal/journal.type";
import { BrandMark } from "@/components/brand-mark";
import {
  ExitIcon,
  GearIcon,
  HamburgerMenuIcon,
  HeartIcon,
  PlusIcon,
  ReaderIcon,
} from "@radix-ui/react-icons";
import {
  Box,
  Button,
  Dialog,
  Flex,
  Grid,
  IconButton,
  Select,
  Separator,
  Text,
  Tooltip,
} from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import type { SidebarSection } from "./app-sidebar";

type JournalMobileHeaderProps = {
  activeSection: SidebarSection;
  currentUser: User;
  entries: JournalEntry[];
  selectedId: string | undefined;
  onNewEntry: () => void;
  onOpenSettings: () => void;
  onSectionChange: (section: SidebarSection) => void;
  onSelectEntry: (entryId: string) => void;
  onSignOut: () => void;
};

export function JournalMobileHeader({
  activeSection,
  currentUser,
  entries,
  selectedId,
  onNewEntry,
  onOpenSettings,
  onSectionChange,
  onSelectEntry,
  onSignOut,
}: JournalMobileHeaderProps) {
  const t = useTranslations("sidebar");
  const tEntries = useTranslations("entry-list");

  return (
    <Box asChild display={{ initial: "block", lg: "none" }}>
      <header>
        <Flex align="center" gap="3" px="4" py="3">
          <Dialog.Root>
            <Dialog.Trigger>
              <IconButton
                variant="ghost"
                color="gray"
                aria-label={t("journalNavigationLabel")}
              >
                <HamburgerMenuIcon aria-hidden />
              </IconButton>
            </Dialog.Trigger>
            <Dialog.Content maxWidth="360px">
              <BrandMark />
              <Dialog.Title mt="5">{t("journalNavigationLabel")}</Dialog.Title>
              <Dialog.Description size="2" color="gray">
                {currentUser.displayName}
              </Dialog.Description>

              <Grid asChild gap="2" mt="5">
                <nav aria-label={t("primaryLabel")}>
                  <Dialog.Close>
                    <Button
                      variant={activeSection === "journal" ? "soft" : "ghost"}
                      onClick={() => onSectionChange("journal")}
                    >
                      <Grid
                        columns="auto 1fr"
                        align="center"
                        gap="2"
                        width="100%"
                      >
                        <ReaderIcon aria-hidden />
                        <Text align="left">{t("sections.journal")}</Text>
                      </Grid>
                    </Button>
                  </Dialog.Close>
                  <Dialog.Close>
                    <Button
                      variant={activeSection === "favorites" ? "soft" : "ghost"}
                      onClick={() => onSectionChange("favorites")}
                    >
                      <Grid
                        columns="auto 1fr"
                        align="center"
                        gap="2"
                        width="100%"
                      >
                        <HeartIcon aria-hidden />
                        <Text align="left">{t("sections.favorites")}</Text>
                      </Grid>
                    </Button>
                  </Dialog.Close>
                </nav>
              </Grid>

              <Separator size="4" my="4" />

              <Flex direction="column" gap="2">
                <Dialog.Close>
                  <Button variant="ghost" color="gray" onClick={onOpenSettings}>
                    <Grid
                      columns="auto 1fr"
                      align="center"
                      gap="2"
                      width="100%"
                    >
                      <GearIcon aria-hidden />
                      <Text align="left">{t("account.privacySettings")}</Text>
                    </Grid>
                  </Button>
                </Dialog.Close>
                <Dialog.Close>
                  <Button variant="ghost" color="red" onClick={onSignOut}>
                    <Grid
                      columns="auto 1fr"
                      align="center"
                      gap="2"
                      width="100%"
                    >
                      <ExitIcon aria-hidden />
                      <Text align="left">{t("account.signOut")}</Text>
                    </Grid>
                  </Button>
                </Dialog.Close>
              </Flex>
            </Dialog.Content>
          </Dialog.Root>

          <Flex display={{ initial: "none", sm: "flex" }}>
            <BrandMark compact />
          </Flex>

          <Select.Root value={selectedId ?? ""} onValueChange={onSelectEntry}>
            <Box asChild flexGrow="1" minWidth="0">
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

          <Tooltip content={t("newEntry")}>
            <IconButton onClick={onNewEntry} aria-label={t("newEntry")}>
              <PlusIcon aria-hidden />
            </IconButton>
          </Tooltip>
        </Flex>
        <Separator size="4" />
      </header>
    </Box>
  );
}
