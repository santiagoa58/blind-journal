"use client";

import { ChevronDownIcon, ExitIcon, LockClosedIcon, PlusIcon } from "@radix-ui/react-icons";
import {
  Avatar,
  Button,
  Callout,
  DropdownMenu,
  Flex,
  Grid,
  Separator,
  Text,
} from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import { BrandMark } from "@/components/brand-mark";
import { useLogout } from "@/hooks/use-logout";
import { useUser } from "@/state/user.state";
import { useCreateJournalEntry } from "./use-create-journal-entry";

function getInitials(displayName: string) {
  return displayName
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AppSidebar() {
  const t = useTranslations("sidebar");
  const currentUser = useUser((state) => state.user);
  const {
    createEntry,
    isDisabled: createDisabled,
    isPending: creatingEntry,
  } = useCreateJournalEntry();
  const { isDisabled: signOutDisabled, signOut } = useLogout();

  if (!currentUser) {
    return null;
  }

  return (
    <Flex
      asChild
      direction="column"
      width="248px"
      height="100%"
      flexShrink="0"
      p="4"
      gap="5"
      display={{ initial: "none", lg: "flex" }}
    >
      <aside aria-label={t("journalNavigationLabel")}>
        <BrandMark />

        <Button onClick={createEntry} size="3" loading={creatingEntry} disabled={createDisabled}>
          <PlusIcon aria-hidden width={17} height={17} />
          {t("newEntry")}
        </Button>

        <Flex asChild direction="column" gap="4" mt="auto">
          <footer>
            <Callout.Root size="1" variant="surface" color="iris">
              <Callout.Icon>
                <LockClosedIcon aria-hidden width={16} height={16} />
              </Callout.Icon>
              <Callout.Text>
                <Text as="span" weight="medium">
                  {t("privacy.title")}{" "}
                </Text>
                {t("privacy.description")}
              </Callout.Text>
            </Callout.Root>

            <Separator size="4" />

            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <Grid asChild width="100%">
                  <Button variant="ghost" color="gray" size="2">
                    <Grid columns="auto minmax(0, 1fr) auto" align="center" gap="2" width="100%">
                      <Avatar
                        size="1"
                        fallback={getInitials(currentUser.displayName)}
                        color="iris"
                      />
                      <Text truncate>{currentUser.displayName}</Text>
                      <ChevronDownIcon aria-hidden width={14} height={14} />
                    </Grid>
                  </Button>
                </Grid>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="start" side="top">
                <DropdownMenu.Label>{currentUser.username}</DropdownMenu.Label>
                <DropdownMenu.Item color="red" onSelect={signOut} disabled={signOutDisabled}>
                  <ExitIcon aria-hidden width={15} height={15} />
                  {t("account.signOut")}
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </footer>
        </Flex>
      </aside>
    </Flex>
  );
}
