"use client";

import { ExclamationTriangleIcon, Pencil2Icon, PlusIcon } from "@radix-ui/react-icons";
import {
  Avatar,
  Box,
  Button,
  Callout,
  Card,
  Container,
  Flex,
  Heading,
  Separator,
  Spinner,
  Text,
} from "@radix-ui/themes";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { getSession, logout } from "@/api/auth/auth";
import {
  createJournalEntry,
  deleteJournalEntry,
  listJournalEntries,
  updateJournalEntry,
} from "@/api/journal/journal";
import { JOURNAL_ERROR_CODES } from "@/api/journal/journal.error";
import type {
  ApiJournalEntriesResponse,
  ClientCreateJournalEntryRequest,
  ClientUpdateJournalEntryRequest,
  JournalEntry,
} from "@/api/journal/journal.type";
import { useAppToast } from "@/hooks/use-app-toast";
import { useRouter } from "@/i18n/navigation";
import { useUser } from "@/state/user.state";
import { AppSidebar, type SidebarSection } from "./app-sidebar";
import { EntryList } from "./entry-list";
import { JournalEditor } from "./journal-editor";
import { JournalMobileHeader } from "./journal-mobile-header";

const sessionQueryKey = ["auth", "session"] as const;
const entriesQueryKey = ["journal", "entries"] as const;

function updateEntryCache(
  current: ApiJournalEntriesResponse | undefined,
  entry: JournalEntry,
): ApiJournalEntriesResponse | undefined {
  if (!current?.success) {
    return current;
  }

  return {
    success: true,
    data: current.data
      .map((candidate) => (candidate.id === entry.id ? entry : candidate))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
  };
}

export function JournalWorkspace() {
  const user = useUser((state) => state.user);
  const t = useTranslations("journal");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const appToast = useAppToast();
  const [localSelectedId, setLocalSelectedId] = useState<string>();
  const [activeSection, setActiveSection] = useState<SidebarSection>("journal");
  const sessionQuery = useQuery({
    queryKey: sessionQueryKey,
    queryFn: getSession,
    retry: false,
  });
  const authenticated = sessionQuery.data?.success === true;
  const entriesQuery = useQuery({
    queryKey: entriesQueryKey,
    queryFn: listJournalEntries,
    enabled: authenticated,
    retry: 1,
  });
  const entries = entriesQuery.data?.success ? entriesQuery.data.data : [];
  const favoriteCount = entries.filter(({ favorite }) => favorite).length;
  const selectedId = localSelectedId ?? entries[0]?.id;
  const selectedEntry = useMemo(
    () => entries.find(({ id }) => id === selectedId) ?? entries[0],
    [entries, selectedId],
  );

  useEffect(() => {
    if (sessionQuery.data && !sessionQuery.data.success) {
      appToast.error(tAuth("errors.unauthorized"));
      router.replace("/");
    }
  }, [appToast, router, sessionQuery.data, tAuth]);

  function getJournalErrorMessage(code: string, fallback: "create" | "save" | "delete") {
    switch (code) {
      case JOURNAL_ERROR_CODES.invalidEntry:
        return t("errors.invalidEntry");
      case JOURNAL_ERROR_CODES.entryNotFound:
        return t("errors.entryNotFound");
      default:
        return t(`errors.${fallback}`);
    }
  }

  const createMutation = useMutation({
    mutationKey: ["journal", "create"],
    mutationFn: (input: ClientCreateJournalEntryRequest) => {
      if (!user) {
        throw new Error("User not found");
      }
      return createJournalEntry(input, user);
    },
    onError() {
      appToast.error(t("errors.create"));
    },
    onSuccess(response, _vars, _mutationRes, ctx) {
      if (!response.success) {
        appToast.error(getJournalErrorMessage(response.error.code, "create"));
        return;
      }

      ctx.client.setQueryData<ApiJournalEntriesResponse>(entriesQueryKey, (current) => ({
        success: true,
        data: [response.data, ...(current?.success ? current.data : [])],
      }));
      setLocalSelectedId(response.data.id);
      setActiveSection("journal");
      appToast.success(t("success.created"));
    },
  });
  const saveMutation = useMutation({
    mutationKey: ["journal", "save"],
    mutationFn: (input: ClientUpdateJournalEntryRequest) => {
      if (!user) {
        throw new Error("User not found");
      }
      return updateJournalEntry(input, user);
    },
    onError() {
      appToast.error(t("errors.save"));
    },
    onSuccess(response, _vars, _mutationRes, ctx) {
      if (!response.success) {
        appToast.error(getJournalErrorMessage(response.error.code, "save"));
        return;
      }

      ctx.client.setQueryData<ApiJournalEntriesResponse>(entriesQueryKey, (current) =>
        updateEntryCache(current, response.data),
      );
      appToast.success(t("success.saved"));
    },
  });

  const deleteMutation = useMutation({
    mutationKey: ["journal", "delete"],
    mutationFn: deleteJournalEntry,
    onError() {
      appToast.error(t("errors.delete"));
    },
    onSuccess(response, _vars, _mutationRes, ctx) {
      if (!response.success) {
        appToast.error(getJournalErrorMessage(response.error.code, "delete"));
        return;
      }

      ctx.client.setQueryData<ApiJournalEntriesResponse>(entriesQueryKey, (current) => {
        if (!current?.success) {
          return current;
        }

        return {
          success: true,
          data: current.data.filter(({ id }) => id !== response.data.id),
        };
      });
      setLocalSelectedId(undefined);
      appToast.success(t("success.deleted"));
    },
  });
  const logoutMutation = useMutation({
    mutationKey: ["auth", "logout"],
    mutationFn: logout,
    onError() {
      appToast.error(tCommon("errors.network"));
    },
    onSuccess(_resp, _vars, _mutationRes, ctx) {
      ctx.client.removeQueries({ queryKey: sessionQueryKey });
      ctx.client.removeQueries({ queryKey: entriesQueryKey });
      router.replace("/");
    },
  });

  function handleCreateEntry() {
    createMutation.mutate({
      title: t("newEntry.title"),
      content: t("newEntry.content"),
    });
  }

  function handleSectionChange(section: SidebarSection) {
    setActiveSection(section);

    if (section === "favorites") {
      setLocalSelectedId(entries.find(({ favorite }) => favorite)?.id);
    }
  }

  if (sessionQuery.isPending || (authenticated && entriesQuery.isPending)) {
    return (
      <Flex align="center" justify="center" gap="3" height="100dvh">
        <Spinner aria-label={tCommon("labels.loading")} />
        <Text color="gray">{tCommon("labels.loading")}</Text>
      </Flex>
    );
  }

  if (!sessionQuery.data?.success) {
    return null;
  }

  if (entriesQuery.isError || (entriesQuery.data && !entriesQuery.data.success)) {
    return (
      <Container size="1" py="9" px="4">
        <Callout.Root color="red" role="alert">
          <Callout.Icon>
            <ExclamationTriangleIcon />
          </Callout.Icon>
          <Callout.Text>{t("errors.load")}</Callout.Text>
        </Callout.Root>
        <Button mt="4" onClick={() => entriesQuery.refetch()}>
          {tCommon("actions.retry")}
        </Button>
      </Container>
    );
  }

  return (
    <Flex direction="column" height="100dvh" overflow="hidden">
      <JournalMobileHeader
        activeSection={activeSection}
        currentUser={sessionQuery.data.data.user}
        entries={entries}
        selectedId={selectedEntry?.id}
        onNewEntry={handleCreateEntry}
        onSectionChange={handleSectionChange}
        onSelectEntry={setLocalSelectedId}
        onSignOut={() => logoutMutation.mutate()}
      />

      <Flex flexGrow="1" minHeight="0" overflow="hidden">
        <AppSidebar
          activeSection={activeSection}
          currentUser={sessionQuery.data.data.user}
          entryCount={entries.length}
          favoriteCount={favoriteCount}
          onSectionChange={handleSectionChange}
          onNewEntry={handleCreateEntry}
          onSignOut={() => logoutMutation.mutate()}
          signingOut={logoutMutation.isPending}
        />
        <Box asChild display={{ initial: "none", lg: "block" }}>
          <Separator orientation="vertical" size="4" />
        </Box>
        <EntryList
          entries={entries}
          selectedId={selectedEntry?.id}
          filter={activeSection === "favorites" ? "favorites" : "all"}
          onFilterChange={(filter) => handleSectionChange(filter === "all" ? "journal" : filter)}
          onSelect={setLocalSelectedId}
        />
        <Box asChild display={{ initial: "none", md: "block" }}>
          <Separator orientation="vertical" size="4" />
        </Box>

        {selectedEntry ? (
          <JournalEditor
            key={selectedEntry.id}
            entry={selectedEntry}
            deleting={deleteMutation.isPending}
            saving={saveMutation.isPending}
            onDelete={() => deleteMutation.mutate(selectedEntry.id)}
            onSave={(input) => saveMutation.mutate(input)}
            onToggleFavorite={() =>
              saveMutation.mutate({
                id: selectedEntry.id,
                favorite: !selectedEntry.favorite,
              })
            }
          />
        ) : (
          <Flex align="center" justify="center" flexGrow="1" p="5">
            <Card size="4" variant="surface">
              <Flex direction="column" align="center" gap="3">
                <Avatar
                  size="4"
                  variant="soft"
                  color="iris"
                  fallback={<Pencil2Icon aria-hidden />}
                />
                <Heading as="h1" size="6" align="center">
                  {t("empty.title")}
                </Heading>
                <Container size="1">
                  <Text as="p" color="gray" align="center">
                    {t("empty.description")}
                  </Text>
                </Container>
                <Button onClick={handleCreateEntry} loading={createMutation.isPending}>
                  <PlusIcon aria-hidden />
                  {t("empty.action")}
                </Button>
              </Flex>
            </Card>
          </Flex>
        )}
      </Flex>
    </Flex>
  );
}
