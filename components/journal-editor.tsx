"use client";

import {
  BookmarkIcon,
  CheckCircledIcon,
  ChevronDownIcon,
  DotsHorizontalIcon,
  DownloadIcon,
  FontBoldIcon,
  FontItalicIcon,
  HeartFilledIcon,
  HeartIcon,
  ListBulletIcon,
  LockClosedIcon,
  QuoteIcon,
  RowsIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import {
  Badge,
  Box,
  Button,
  DropdownMenu,
  Flex,
  IconButton,
  ScrollArea,
  Separator,
  Text,
  TextArea,
  Tooltip,
} from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import type { JournalEntry } from "@/api/journal/journal.type";

type JournalEditorProps = {
  entry: JournalEntry;
  onChange: (entry: JournalEntry) => void;
};

export function JournalEditor({ entry, onChange }: JournalEditorProps) {
  const t = useTranslations("journal-editor");
  const tJournal = useTranslations("journal");
  const formatActions = [
    { label: t("formatting.bold"), icon: FontBoldIcon },
    { label: t("formatting.italic"), icon: FontItalicIcon },
    { label: t("formatting.bulletedList"), icon: ListBulletIcon },
    { label: t("formatting.numberedList"), icon: RowsIcon },
    { label: t("formatting.quote"), icon: QuoteIcon },
  ];
  const favoriteLabel = entry.favorite ? t("removeFromFavorites") : t("addToFavorites");
  const setField = <Key extends keyof JournalEntry>(key: Key, value: JournalEntry[Key]) => {
    onChange({ ...entry, [key]: value, updatedAt: t("savedJustNow") });
  };

  return (
    <Flex asChild direction="column" height="100vh" minWidth="0" flexGrow="1">
      <main>
        <Flex align="center" justify="between" gap="3" px={{ initial: "3", sm: "5" }} py="3">
          <Flex align="center" gap="2" minWidth="0">
            <Badge size="2" variant="surface" color="iris">
              <CheckCircledIcon aria-hidden width={14} height={14} />
              {t("encryptedOnDevice")}
            </Badge>
            <Tooltip content={t("privateEntry")}>
              <IconButton variant="ghost" color="gray" aria-label={t("encryptionDetails")}>
                <LockClosedIcon aria-hidden width={16} height={16} />
              </IconButton>
            </Tooltip>
          </Flex>

          <Flex align="center" gap="1">
            <Tooltip content={favoriteLabel}>
              <IconButton
                variant={entry.favorite ? "soft" : "ghost"}
                color={entry.favorite ? "iris" : "gray"}
                onClick={() => setField("favorite", !entry.favorite)}
                aria-label={favoriteLabel}
              >
                {entry.favorite ? (
                  <HeartFilledIcon aria-hidden width={16} height={16} />
                ) : (
                  <HeartIcon aria-hidden width={16} height={16} />
                )}
              </IconButton>
            </Tooltip>

            <Box asChild display={{ initial: "none", sm: "block" }}>
              <Button variant="ghost" color="gray">
                {t("sharePrivately")} <ChevronDownIcon aria-hidden width={14} height={14} />
              </Button>
            </Box>

            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <IconButton variant="ghost" color="gray" aria-label={t("entryActions")}>
                  <DotsHorizontalIcon aria-hidden width={17} height={17} />
                </IconButton>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="end">
                <DropdownMenu.Item>
                  <DownloadIcon aria-hidden width={15} height={15} /> {t("exportEncryptedCopy")}
                </DropdownMenu.Item>
                <DropdownMenu.Item>
                  <BookmarkIcon aria-hidden width={15} height={15} /> {t("manageTags")}
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item color="red">
                  <TrashIcon aria-hidden width={15} height={15} /> {t("moveToTrash")}
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </Flex>
        </Flex>

        <Separator size="4" />

        <Flex align="center" gap="1" px={{ initial: "3", sm: "5" }} py="2">
          {formatActions.map(({ label, icon: Icon }) => (
            <Tooltip key={label} content={label}>
              <IconButton variant="ghost" color="gray" aria-label={label}>
                <Icon aria-hidden width={16} height={16} />
              </IconButton>
            </Tooltip>
          ))}
          <Separator orientation="vertical" size="2" mx="2" />
          <Button variant="ghost" color="gray">
            <BookmarkIcon aria-hidden width={15} height={15} /> {t("addTag")}
          </Button>
        </Flex>

        <Separator size="4" />

        <Flex asChild flexGrow="1" minHeight="0">
          <ScrollArea scrollbars="vertical">
            <Box
              maxWidth="760px"
              mx="auto"
              px={{ initial: "4", sm: "6", lg: "8" }}
              py={{ initial: "6", sm: "8" }}
            >
              <Flex wrap="wrap" align="center" gap="2">
                <Text size="1" color="gray">
                  {entry.dateLabel}
                </Text>
                <Text size="1" color="gray" aria-hidden>
                  ·
                </Text>
                <Text size="1" color="gray">
                  {entry.timeLabel}
                </Text>
                <Text size="1" color="gray" aria-hidden>
                  ·
                </Text>
                <Button size="1" variant="ghost">
                  {tJournal(`moods.${entry.mood}`)}
                </Button>
              </Flex>

              <TextArea
                aria-label={t("entryTitleLabel")}
                value={entry.title}
                onChange={(event) => setField("title", event.target.value)}
                mt="4"
                size="3"
                variant="soft"
                resize="none"
                rows={2}
              />

              <TextArea
                aria-label={t("entryBodyLabel")}
                value={entry.body}
                onChange={(event) => {
                  const body = event.target.value;
                  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;
                  onChange({
                    ...entry,
                    body,
                    preview: body.slice(0, 120) || t("startWriting"),
                    wordCount,
                    updatedAt: t("savedJustNow"),
                  });
                }}
                mt="4"
                size="3"
                variant="soft"
                resize="vertical"
                rows={16}
                placeholder={t("startWriting")}
              />

              <Flex wrap="wrap" gap="2" mt="5">
                {entry.tags.map((tag) => (
                  <Badge key={tag} size="2" variant="soft" color="iris">
                    #{tag}
                  </Badge>
                ))}
              </Flex>
            </Box>
          </ScrollArea>
        </Flex>

        <Separator size="4" />
        <Flex align="center" justify="between" px={{ initial: "3", sm: "5" }} py="2">
          <Text size="1" color="gray">
            {entry.updatedAt}
          </Text>
          <Text size="1" color="gray">
            {t("wordsCount", { count: entry.wordCount })}
          </Text>
        </Flex>
      </main>
    </Flex>
  );
}
