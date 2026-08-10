"use client";

import {
  ExitIcon,
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
import { BrandMark } from "@/components/brand-mark";
import { useLogout } from "@/hooks/use-logout";
import { useUser } from "@/state/user.state";
import { useJournalWorkspace } from "./journal-workspace-context";
import { useCreateJournalEntry } from "./use-create-journal-entry";

export function JournalMobileHeader() {
  const t = useTranslations("sidebar");
  const tEntries = useTranslations("entry-list");
  const currentUser = useUser((state) => state.user);
  const workspace = useJournalWorkspace();
  const { createEntry, isPending: creatingEntry } = useCreateJournalEntry();
  const { isPending: signingOut, signOut } = useLogout();

  if (!currentUser || !workspace) {
    return null;
  }

  const { activeSection, entries, selectedEntry, selectEntry, selectSection } = workspace;

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

              <Grid asChild gap="2" mt="5">
                <nav aria-label={t("primaryLabel")}>
                  <Dialog.Close>
                    <Button
                      variant={activeSection === "journal" ? "soft" : "ghost"}
                      onClick={() => selectSection("journal")}
                    >
                      <Grid columns="auto 1fr" align="center" gap="2" width="100%">
                        <ReaderIcon aria-hidden />
                        <Text align="left">{t("sections.journal")}</Text>
                      </Grid>
                    </Button>
                  </Dialog.Close>
                  <Dialog.Close>
                    <Button
                      variant={activeSection === "favorites" ? "soft" : "ghost"}
                      onClick={() => selectSection("favorites")}
                    >
                      <Grid columns="auto 1fr" align="center" gap="2" width="100%">
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
                  <Button variant="ghost" color="red" onClick={signOut} disabled={signingOut}>
                    <Grid columns="auto 1fr" align="center" gap="2" width="100%">
                      <ExitIcon aria-hidden />
                      <Text align="left">{t("account.signOut")}</Text>
                    </Grid>
                  </Button>
                </Dialog.Close>
              </Flex>
            </Dialog.Content>
          </Dialog.Root>

          <Select.Root value={selectedEntry?.id ?? ""} onValueChange={selectEntry}>
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
            <IconButton onClick={createEntry} aria-label={t("newEntry")} loading={creatingEntry}>
              <PlusIcon aria-hidden />
            </IconButton>
          </Tooltip>
        </Flex>
        <Separator size="4" />
      </header>
    </Box>
  );
}
