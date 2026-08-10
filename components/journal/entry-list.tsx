"use client";

import { HeartFilledIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import {
  Avatar,
  Box,
  Card,
  Flex,
  Heading,
  ScrollArea,
  SegmentedControl,
  Separator,
  Text,
  TextField,
} from "@radix-ui/themes";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { useJournalWorkspace } from "./journal-workspace-context";

export function EntryList() {
  const t = useTranslations("entry-list");
  const format = useFormatter();
  const [query, setQuery] = useState("");
  const workspace = useJournalWorkspace();

  if (!workspace) {
    return null;
  }

  const { activeSection, entries, selectedEntry, selectEntry, selectSection } = workspace;
  const filter = activeSection === "favorites" ? "favorites" : "all";
  const normalizedQuery = query.trim().toLowerCase();
  const visibleEntries = entries.filter((entry) => {
    const matchesFilter = filter === "all" || entry.favorite;
    const matchesQuery =
      normalizedQuery.length === 0 ||
      entry.title.toLowerCase().includes(normalizedQuery) ||
      entry.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery));

    return matchesFilter && matchesQuery;
  });

  return (
    <Flex
      asChild
      direction="column"
      width="360px"
      height="100%"
      flexShrink="0"
      display={{ initial: "none", md: "flex" }}
    >
      <section aria-label={t("sectionLabel")}>
        <Box p="5" pb="3">
          <Box>
            <Text size="1" weight="medium" color="iris">
              {t("eyebrow")}
            </Text>
            <Heading as="h1" size="6" mt="1">
              {t("title")}
            </Heading>
          </Box>

          <TextField.Root
            mt="4"
            size="3"
            aria-label={t("searchPlaceholder")}
            placeholder={t("searchPlaceholder")}
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
              onValueChange={(value) => selectSection(value === "all" ? "journal" : "favorites")}
            >
              <SegmentedControl.Item value="all">{t("all")}</SegmentedControl.Item>
              <SegmentedControl.Item value="favorites">{t("favorites")}</SegmentedControl.Item>
            </SegmentedControl.Root>
            <Text size="1" color="gray">
              {t("entriesCount", { count: visibleEntries.length })}
            </Text>
          </Flex>
        </Box>

        <Flex asChild flexGrow="1" minHeight="0">
          <ScrollArea scrollbars="vertical">
            <Flex direction="column" gap="2" p="3" pt="1">
              {visibleEntries.map((entry) => {
                const selected = entry.id === selectedEntry?.id;
                const updatedAt = new Date(entry.updatedAt);

                return (
                  <Card asChild key={entry.id} size="2" variant={selected ? "classic" : "ghost"}>
                    <button
                      type="button"
                      onClick={() => selectEntry(entry.id)}
                      aria-label={t("openEntryLabel", { title: entry.title })}
                    >
                      <Flex direction="column" gap="2">
                        <Flex align="start" gap="2">
                          <Box flexGrow="1" minWidth="0">
                            <Text size="2" weight="bold" truncate align="left">
                              {entry.title}
                            </Text>
                          </Box>
                          {entry.favorite ? (
                            <HeartFilledIcon
                              aria-label={t("favoriteLabel")}
                              width={15}
                              height={15}
                            />
                          ) : null}
                        </Flex>

                        <Flex align="center" gap="2">
                          <Text size="1" color="gray">
                            {format.dateTime(updatedAt, {
                              month: "short",
                              day: "numeric",
                            })}
                          </Text>
                          <Separator orientation="vertical" size="1" />
                          <Text size="1" color="gray">
                            {format.dateTime(updatedAt, {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </Text>
                        </Flex>
                      </Flex>
                    </button>
                  </Card>
                );
              })}

              {visibleEntries.length === 0 ? (
                <Flex direction="column" align="center" justify="center" py="9" px="5">
                  <Avatar
                    size="3"
                    color="gray"
                    variant="soft"
                    fallback={<MagnifyingGlassIcon aria-hidden />}
                  />
                  <Text as="p" size="2" weight="medium" mt="3">
                    {t("emptyTitle")}
                  </Text>
                  <Text as="p" size="1" color="gray" mt="1" align="center">
                    {t("emptyDescription")}
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
