"use client";

import {
  ChevronDownIcon,
  ExitIcon,
  HeartIcon,
  LockClosedIcon,
  PlusIcon,
  ReaderIcon,
} from "@radix-ui/react-icons";
import {
  Avatar,
  Badge,
  Button,
  Callout,
  DropdownMenu,
  Flex,
  Grid,
  Separator,
  Text,
} from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import type { User } from "@/api/auth/user.type";
import { BrandMark } from "@/components/brand-mark";

export type SidebarSection = "journal" | "favorites";

type AppSidebarProps = {
  activeSection: SidebarSection;
  currentUser: User;
  entryCount: number;
  favoriteCount: number;
  onSectionChange: (section: SidebarSection) => void;
  onNewEntry: () => void;
  onSignOut: () => void;
  signingOut: boolean;
};

function getInitials(displayName: string) {
  return displayName
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AppSidebar({
  activeSection,
  currentUser,
  entryCount,
  favoriteCount,
  onSectionChange,
  onNewEntry,
  onSignOut,
  signingOut,
}: AppSidebarProps) {
  const t = useTranslations("sidebar");
  const navigationItems = [
    {
      value: "journal" as const,
      label: t("sections.journal"),
      icon: ReaderIcon,
      count: entryCount,
    },
    {
      value: "favorites" as const,
      label: t("sections.favorites"),
      icon: HeartIcon,
      count: favoriteCount,
    },
  ];

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

        <Button onClick={onNewEntry} size="3">
          <PlusIcon aria-hidden width={17} height={17} />
          {t("newEntry")}
        </Button>

        <Grid asChild gap="1">
          <nav aria-label={t("primaryLabel")}>
            {navigationItems.map(({ value, label, icon: Icon, count }) => {
              const active = activeSection === value;

              return (
                <Button
                  key={value}
                  variant={active ? "soft" : "ghost"}
                  color={active ? "iris" : "gray"}
                  onClick={() => onSectionChange(value)}
                  aria-current={active ? "page" : undefined}
                >
                  <Grid columns="auto 1fr auto" align="center" gap="2" width="100%">
                    <Icon aria-hidden width={16} height={16} />
                    <Text align="left" weight={active ? "medium" : "regular"}>
                      {label}
                    </Text>
                    <Badge color={active ? "iris" : "gray"} variant="soft">
                      {count}
                    </Badge>
                  </Grid>
                </Button>
              );
            })}
          </nav>
        </Grid>

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
                <DropdownMenu.Item color="red" onSelect={onSignOut} disabled={signingOut}>
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
