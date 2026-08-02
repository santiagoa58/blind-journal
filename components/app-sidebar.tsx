"use client";

import {
  ArchiveIcon,
  CalendarIcon,
  ChevronDownIcon,
  GearIcon,
  HeartIcon,
  LockClosedIcon,
  MagicWandIcon,
  PersonIcon,
  PlusIcon,
  ReaderIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Callout,
  Card,
  DropdownMenu,
  Flex,
  Kbd,
  Separator,
  Text,
  Tooltip,
} from "@radix-ui/themes";
import { messages } from "@/messages";

import { BrandMark } from "./brand-mark";

export type SidebarSection = "journal" | "calendar" | "favorites" | "archive" | "trash";

type AppSidebarProps = {
  activeSection: SidebarSection;
  currentUser: {
    avatarFallback: string;
    displayName: string;
  };
  onSectionChange: (section: SidebarSection) => void;
  onNewEntry: () => void;
  onOpenSettings: () => void;
};

const copy = messages.navigation;

const primaryItems = [
  { value: "journal" as const, label: copy.sections.journal, icon: ReaderIcon },
  { value: "calendar" as const, label: copy.sections.calendar, icon: CalendarIcon },
  { value: "favorites" as const, label: copy.sections.favorites, icon: HeartIcon },
];

const utilityItems = [
  { value: "archive" as const, label: copy.sections.archive, icon: ArchiveIcon },
  { value: "trash" as const, label: copy.sections.trash, icon: TrashIcon },
];

function SidebarButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active?: boolean;
  icon: typeof ReaderIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <Card asChild size="1" variant={active ? "surface" : "ghost"}>
      <button type="button" onClick={onClick} aria-current={active ? "page" : undefined}>
        <Flex align="center" gap="3">
          <Icon aria-hidden width={16} height={16} />
          <Text size="2" weight={active ? "medium" : "regular"}>
            {label}
          </Text>
        </Flex>
      </button>
    </Card>
  );
}

function CollectionButton({
  icon: Icon,
  label,
  count,
}: {
  icon: typeof MagicWandIcon;
  label: string;
  count: number;
}) {
  return (
    <Card asChild size="1" variant="ghost">
      <button type="button">
        <Flex align="center" gap="3">
          <Icon aria-hidden width={16} height={16} />
          <Text size="2">{label}</Text>
          <Badge ml="auto" color="gray" variant="soft">
            {count}
          </Badge>
        </Flex>
      </button>
    </Card>
  );
}

export function AppSidebar({
  activeSection,
  currentUser,
  onSectionChange,
  onNewEntry,
  onOpenSettings,
}: AppSidebarProps) {
  return (
    <Flex
      asChild
      direction="column"
      width="240px"
      height="100vh"
      flexShrink="0"
      p="3"
      gap="3"
      display={{ initial: "none", lg: "flex" }}
    >
      <aside aria-label={copy.journalNavigationLabel}>
        <Box px="2" py="2">
          <BrandMark />
        </Box>

        <Box asChild width="100%">
          <Button onClick={onNewEntry} size="3">
            <PlusIcon aria-hidden width={17} height={17} />
            {copy.newEntry}
            <Kbd ml="auto" size="1">
              {copy.newEntryShortcut}
            </Kbd>
          </Button>
        </Box>

        <Flex asChild direction="column" gap="1" mt="2">
          <nav aria-label={copy.primaryLabel}>
            {primaryItems.map((item) => (
              <SidebarButton
                key={item.value}
                {...item}
                active={activeSection === item.value}
                onClick={() => onSectionChange(item.value)}
              />
            ))}
          </nav>
        </Flex>

        <Box mt="3" px="2">
          <Text as="div" size="1" weight="medium" color="gray">
            {copy.collectionsTitle}
          </Text>
        </Box>

        <Flex asChild direction="column" gap="1">
          <nav aria-label={copy.collectionsLabel}>
            <CollectionButton
              icon={MagicWandIcon}
              label={copy.collections.personalGrowth}
              count={12}
            />
            <CollectionButton icon={HeartIcon} label={copy.collections.peopleILove} count={8} />
          </nav>
        </Flex>

        <Flex direction="column" gap="1" mt="2">
          {utilityItems.map((item) => (
            <SidebarButton
              key={item.value}
              {...item}
              active={activeSection === item.value}
              onClick={() => onSectionChange(item.value)}
            />
          ))}
        </Flex>

        <Box mt="auto">
          <Callout.Root size="1" variant="surface" color="iris" mb="3">
            <Callout.Icon>
              <LockClosedIcon aria-hidden width={16} height={16} />
            </Callout.Icon>
            <Callout.Text>
              <Text as="span" weight="medium">
                {copy.privacy.title}{" "}
              </Text>
              {copy.privacy.description}
            </Callout.Text>
          </Callout.Root>

          <Separator size="4" mb="2" />

          <Flex align="center" gap="1">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <Button variant="ghost" color="gray" size="2">
                  <Avatar size="1" fallback={currentUser.avatarFallback} color="iris" />
                  {currentUser.displayName}
                  <ChevronDownIcon aria-hidden width={14} height={14} />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="start" side="top">
                <DropdownMenu.Label>{copy.account.menuLabel}</DropdownMenu.Label>
                <DropdownMenu.Item>
                  <PersonIcon aria-hidden width={15} height={15} /> {copy.account.profile}
                </DropdownMenu.Item>
                <DropdownMenu.Item onSelect={onOpenSettings}>
                  <GearIcon aria-hidden width={15} height={15} /> {copy.account.privacySettings}
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item>
                  <LockClosedIcon aria-hidden width={15} height={15} /> {copy.account.lockJournal}
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>

            <Tooltip content={copy.account.settings}>
              <Button
                ml="auto"
                variant="ghost"
                color="gray"
                onClick={onOpenSettings}
                aria-label={copy.account.settings}
              >
                <GearIcon aria-hidden width={16} height={16} />
              </Button>
            </Tooltip>
          </Flex>
        </Box>
      </aside>
    </Flex>
  );
}
