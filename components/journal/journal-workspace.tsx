"use client";

import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Button, Callout, Container, Flex, Spinner, Text } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { listJournalEntries } from "@/api/journal/journal";
import { useErrorMessage } from "@/i18n/error-message";
import { useUser } from "@/state/user.state";
import { JournalContent } from "./journal-content";
import { journalEntriesQueryKey } from "./journal-query";
import { JournalWorkspaceProvider } from "./journal-workspace-context";

export function JournalWorkspace() {
  const user = useUser((state) => state.user);
  const tCommon = useTranslations("common");
  const tApiError = useTranslations("api.errors");
  const getErrorMessage = useErrorMessage();
  const entriesQuery = useQuery({
    queryKey: journalEntriesQueryKey,
    queryFn: () => listJournalEntries(user),
    retry: 1,
  });

  if (entriesQuery.isPending) {
    return (
      <Flex align="center" justify="center" gap="3" height="100dvh">
        <Spinner aria-label={tCommon("labels.loading")} />
        <Text color="gray">{tCommon("labels.loading")}</Text>
      </Flex>
    );
  }

  if (entriesQuery.isError) {
    // TODO(observability): Report an unmapped code before using the explicit generic fallback.
    const errorMessage = getErrorMessage(entriesQuery.error) ?? tApiError("unexpected");

    return (
      <Container size="1" py="9" px="4">
        <Callout.Root color="red" role="alert">
          <Callout.Icon>
            <ExclamationTriangleIcon />
          </Callout.Icon>
          <Callout.Text>{errorMessage}</Callout.Text>
        </Callout.Root>
        <Button mt="4" onClick={() => entriesQuery.refetch()}>
          {tCommon("actions.retry")}
        </Button>
      </Container>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <JournalWorkspaceProvider entries={entriesQuery.data}>
      <JournalContent />
    </JournalWorkspaceProvider>
  );
}
