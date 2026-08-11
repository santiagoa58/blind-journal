"use client";

import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Button, Callout, Container, Flex, Spinner, Text } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import type { ClientUser } from "@/api/auth/user.type";
import { listJournalEntries } from "@/api/journal/journal";
import { useErrorMessage } from "@/i18n/error-message";
import { useRouter } from "@/i18n/navigation";
import { useUser } from "@/state/user.state";
import { JournalContent } from "./journal-content";
import { journalEntriesQueryKey } from "./journal-query";

export function JournalWorkspace() {
  const user = useUser((state) => state.user);

  if (!user) {
    return <LockedJournalWorkspace />;
  }

  return <UnlockedJournalWorkspace user={user} />;
}

function LockedJournalWorkspace() {
  const router = useRouter();
  const tCommon = useTranslations("common");

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <Flex align="center" justify="center" gap="3" height="100dvh">
      <Spinner aria-label={tCommon("labels.loading")} />
      <Text color="gray">{tCommon("labels.loading")}</Text>
    </Flex>
  );
}

function UnlockedJournalWorkspace({ user }: { user: ClientUser }) {
  const tCommon = useTranslations("common");
  const tApiError = useTranslations("api.errors");
  const getErrorMessage = useErrorMessage();
  const entriesQuery = useQuery({
    queryKey: journalEntriesQueryKey(user.id),
    queryFn: () => listJournalEntries(user),
    // TODO(review-medium-query-retry-policy): Retry only transport failures that may succeed
    // unchanged. Authentication, validation, unsupported envelope versions, and AES-GCM
    // decryption failures are deterministic and should immediately enter their recovery UI.
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
    // TODO(review-medium-unmapped-query-code): Report an unmapped code before using the explicit
    // generic fallback so a broken API/client contract remains diagnosable.
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

  return (
    <JournalContent
      entries={entriesQuery.data.entries}
      unreadableEntries={entriesQuery.data.unreadableEntries}
    />
  );
}
