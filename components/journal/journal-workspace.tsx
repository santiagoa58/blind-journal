"use client";

import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Button, Callout, Container, Flex, Spinner, Text } from "@radix-ui/themes";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import type { ClientUser } from "@/api/auth/user.type";
import { API_ERROR_CODES } from "@/api/error";
import { listJournalEntriesPage } from "@/api/journal/journal";
import type { JournalEntriesPage } from "@/api/journal/journal.type";
import { isCodedError, reportClientError } from "@/client.error";
import { useAppSession } from "@/client-state/app-session.state";
import { useErrorMessage } from "@/i18n/error-message";
import type { Base64Url } from "@/types/base64";
import { JournalContent } from "./journal-content";
import { journalEntriesQueryKey } from "./journal-query";

export function JournalWorkspace() {
  const session = useAppSession((state) => state.session);

  if (session.status !== "unlocked") {
    return <JournalWorkspaceLoading />;
  }

  return <UnlockedJournalWorkspace user={session.user} />;
}

function JournalWorkspaceLoading() {
  const tCommon = useTranslations("common");

  return (
    <Flex role="status" align="center" justify="center" gap="3" height="100dvh">
      <Spinner aria-hidden />
      <Text color="gray">{tCommon("labels.loading")}</Text>
    </Flex>
  );
}

function JournalWorkspaceError({ error, retry }: { error: Error; retry: () => void }) {
  const tCommon = useTranslations("common");
  const tApiError = useTranslations("api.errors");
  const getErrorMessage = useErrorMessage();
  const mappedErrorMessage = getErrorMessage(error);
  const reportable =
    mappedErrorMessage === undefined ||
    (isCodedError(error) && error.code === API_ERROR_CODES.unexpected);

  useEffect(() => {
    if (reportable) {
      reportClientError(error);
    }
  }, [error, reportable]);

  return (
    <Container size="1" py="9" px="4">
      <Callout.Root color="red" role="alert">
        <Callout.Icon>
          <ExclamationTriangleIcon aria-hidden />
        </Callout.Icon>
        <Callout.Text>{mappedErrorMessage ?? tApiError("unexpected")}</Callout.Text>
      </Callout.Root>
      <Button mt="4" onClick={() => retry()}>
        {tCommon("actions.retry")}
      </Button>
    </Container>
  );
}

function UnlockedJournalWorkspace({ user }: { user: ClientUser }) {
  const entriesQuery = useInfiniteQuery<
    JournalEntriesPage,
    Error,
    { pages: JournalEntriesPage[]; pageParams: Array<Base64Url | null> },
    ReturnType<typeof journalEntriesQueryKey>,
    Base64Url | null
  >({
    queryKey: journalEntriesQueryKey(user.id),
    queryFn: ({ pageParam, signal }) => listJournalEntriesPage(user, pageParam, signal),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    // Ky retries the GET transport once. Query-level retries would also repeat deterministic
    // response validation and client-side decryption failures.
    retry: false,
  });

  if (entriesQuery.isPending) {
    return <JournalWorkspaceLoading />;
  }

  if (entriesQuery.isError && !entriesQuery.data) {
    return <JournalWorkspaceError error={entriesQuery.error} retry={entriesQuery.refetch} />;
  }

  const entries = entriesQuery.data.pages.flatMap((page) => page.entries);
  const unreadableEntries = entriesQuery.data.pages.flatMap((page) => page.unreadableEntries);

  return (
    <JournalContent
      entries={entries}
      user={user}
      unreadableEntries={unreadableEntries}
      hasMoreEntries={entriesQuery.hasNextPage}
      loadingMoreEntries={entriesQuery.isFetchingNextPage}
      loadMoreEntries={() => entriesQuery.fetchNextPage({ cancelRefetch: false })}
    />
  );
}
