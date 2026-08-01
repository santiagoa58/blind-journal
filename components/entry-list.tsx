"use client";

import {
  CaretSortIcon,
  HeartFilledIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  MixerHorizontalIcon,
} from "@radix-ui/react-icons";
import {
  Badge,
  Box,
  Card,
  DropdownMenu,
  Flex,
  Heading,
  IconButton,
  ScrollArea,
  SegmentedControl,
  Text,
  TextField,
} from "@radix-ui/themes";
import { useMemo, useState } from "react";

import type { JournalEntry } from "@/lib/types/journal.type";

type EntryListProps = {
  entries: JournalEntry[];
  selectedId?: string;
  onSelect: (entryId: string) => void;
};

const moodLabels: Record<JournalEntry["mood"], string> = {
  calm: "Calm",
  hopeful: "Hopeful",
  reflective: "Reflective",
  tired: "Tired",
  grateful: "Grateful",
};

function truncatePreview(preview: string) {
  return preview.length > 104 ? `${preview.slice(0, 104).trimEnd()}…` : preview;
}

export function EntryList({ entries, selectedId, onSelect }: EntryListProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "favorites">("all");
  const [showMood, setShowMood] = useState(true);

  const visibleEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return entries.filter((entry) => {
      const matchesFilter = filter === "all" || entry.favorite;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        entry.title.toLowerCase().includes(normalizedQuery) ||
        entry.preview.toLowerCase().includes(normalizedQuery) ||
        entry.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery));

      return matchesFilter && matchesQuery;
    });
  }, [entries, filter, query]);

  return (
    <Flex
      asChild
      direction="column"
      width="352px"
      height="100vh"
      flexShrink="0"
      display={{ initial: "none", md: "flex" }}
    >
      <section aria-label="Journal entries">
        <Box p="4">
          <Flex align="start" justify="between" gap="4">
            <Box>
              <Text as="div" size="1" weight="medium" color="iris">
                PERSONAL JOURNAL
              </Text>
              <Heading as="h1" size="6" mt="1">
                Your entries
              </Heading>
            </Box>

            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <IconButton
                  variant="ghost"
                  color="gray"
                  aria-label="Entry filters"
                >
                  <MixerHorizontalIcon aria-hidden width={16} height={16} />
                </IconButton>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="end">
                <DropdownMenu.Label>Display</DropdownMenu.Label>
                <DropdownMenu.CheckboxItem
                  checked={showMood}
                  onCheckedChange={(value) => setShowMood(Boolean(value))}
                >
                  Show mood
                </DropdownMenu.CheckboxItem>
                <DropdownMenu.Separator />
                <DropdownMenu.CheckboxItem checked>
                  <CaretSortIcon aria-hidden width={15} height={15} /> Newest
                  first
                </DropdownMenu.CheckboxItem>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </Flex>

          <TextField.Root
            mt="4"
            size="3"
            placeholder="Search your journal"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          >
            <TextField.Slot>
              <MagnifyingGlassIcon aria-hidden width={16} height={16} />
            </TextField.Slot>
          </TextField.Root>

          <Flex mt="3" align="center" justify="between" gap="3">
            <SegmentedControl.Root
              size="1"
              value={filter}
              onValueChange={(value) => setFilter(value as "all" | "favorites")}
            >
              <SegmentedControl.Item value="all">All</SegmentedControl.Item>
              <SegmentedControl.Item value="favorites">
                Favorites
              </SegmentedControl.Item>
            </SegmentedControl.Root>
            <Text size="1" color="gray">
              {visibleEntries.length} entries
            </Text>
          </Flex>
        </Box>

        <Flex asChild flexGrow="1" minHeight="0">
          <ScrollArea scrollbars="vertical">
            <Flex direction="column" gap="2" p="3" pt="1">
              {visibleEntries.map((entry) => {
                const selected = entry.id === selectedId;

                return (
                  <Card
                    asChild
                    key={entry.id}
                    size="2"
                    variant={selected ? "classic" : "ghost"}
                  >
                    <button type="button" onClick={() => onSelect(entry.id)}>
                      <Flex direction="column" gap="2">
                        <Flex align="start" gap="2">
                          <Box flexGrow="1">
                            <Text as="div" size="2" weight="bold">
                              {entry.title}
                            </Text>
                          </Box>
                          {entry.favorite ? (
                            <HeartFilledIcon
                              aria-label="Favorite"
                              width={15}
                              height={15}
                            />
                          ) : null}
                        </Flex>

                        <Text as="p" size="1" color="gray">
                          {truncatePreview(entry.preview)}
                        </Text>

                        <Flex align="center" gap="2">
                          <Text size="1" color="gray">
                            {entry.dateLabel.replace(/^[A-Za-z]+, /, "")}
                          </Text>
                          <Text size="1" color="gray" aria-hidden>
                            ·
                          </Text>
                          <Text size="1" color="gray">
                            {entry.timeLabel}
                          </Text>
                          <LockClosedIcon
                            aria-label="Encrypted"
                            width={13}
                            height={13}
                          />
                        </Flex>

                        {showMood ? (
                          <Badge
                            size="1"
                            variant="soft"
                            color={selected ? "iris" : "gray"}
                          >
                            {moodLabels[entry.mood]}
                          </Badge>
                        ) : null}
                      </Flex>
                    </button>
                  </Card>
                );
              })}

              {visibleEntries.length === 0 ? (
                <Flex
                  direction="column"
                  align="center"
                  justify="center"
                  py="9"
                  px="5"
                >
                  <MagnifyingGlassIcon aria-hidden width={20} height={20} />
                  <Text as="p" size="2" weight="medium" mt="3">
                    No matching entries
                  </Text>
                  <Text as="p" size="1" color="gray" mt="1" align="center">
                    Try a title, tag, or a phrase you remember.
                  </Text>
                </Flex>
              ) : null}
            </Flex>
          </ScrollArea>
        </Flex>
      </section>
    </Flex>
  );
}
