"use client";

import { Pencil2Icon, PlusIcon } from "@radix-ui/react-icons";
import { Avatar, Button, Card, Container, Flex, Heading, Text } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import { useCreateJournalEntry } from "./use-create-journal-entry";

export function JournalEmptyCard() {
  const t = useTranslations("journal");
  const { createEntry, isPending } = useCreateJournalEntry();

  return (
    <Card size="4" variant="surface">
      <Flex direction="column" align="center" gap="3">
        <Avatar size="4" variant="soft" color="iris" fallback={<Pencil2Icon aria-hidden />} />
        <Heading as="h1" size="6" align="center">
          {t("empty.title")}
        </Heading>
        <Container size="1">
          <Text as="p" color="gray" align="center">
            {t("empty.description")}
          </Text>
        </Container>
        <Button onClick={createEntry} loading={isPending}>
          <PlusIcon aria-hidden />
          {t("empty.action")}
        </Button>
      </Flex>
    </Card>
  );
}
