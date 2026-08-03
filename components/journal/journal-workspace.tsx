"use client";

import { getSession, logout } from "@/api/auth/auth";
import {
  createJournalEntry,
  deleteJournalEntry,
  listJournalEntries,
  updateJournalEntry,
} from "@/api/journal/journal";
import { JOURNAL_ERROR_CODES } from "@/api/journal/journal.error";
import type {
  JournalEntriesResponse,
  JournalEntry,
  UpdateJournalEntryRequest,
} from "@/api/journal/journal.type";
import { useAppToast } from "@/hooks/use-app-toast";
import { useRouter } from "@/i18n/navigation";
import {
  ExclamationTriangleIcon,
  Pencil2Icon,
  PlusIcon,
} from "@radix-ui/react-icons";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { AppSidebar, type SidebarSection } from "./app-sidebar";
import { EntryList } from "./entry-list";
import { JournalEditor } from "./journal-editor";
import { JournalMobileHeader } from "./journal-mobile-header";
import { PrivacySettingsDialog } from "./privacy-settings-dialog";

const sessionQueryKey = ["auth", "session"] as const;
const entriesQueryKey = ["journal", "entries"] as const;

function updateEntryCache(
  current: JournalEntriesResponse | undefined,
  entry: JournalEntry,
): JournalEntriesResponse | undefined {
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
  const t = useTranslations("journal");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const queryClient = useQueryClient();
  const appToast = useAppToast();
  const [selectedId, setSelectedId] = useState<string>();
  const [activeSection, setActiveSection] = useState<SidebarSection>("journal");
  const [settingsOpen, setSettingsOpen] = useState(false);
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

  useEffect(() => {
    if (!selectedId && entries[0]) {
      setSelectedId(entries[0].id);
    }
  }, [entries, selectedId]);

  function getJournalErrorMessage(
    code: string,
    fallback: "create" | "save" | "delete",
  ) {
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
    mutationFn: createJournalEntry,
    onError() {
      appToast.error(t("errors.create"));
    },
    onSuccess(response) {
      if (!response.success) {
        appToast.error(getJournalErrorMessage(response.error.code, "create"));
        return;
      }

      queryClient.setQueryData<JournalEntriesResponse>(
        entriesQueryKey,
        (current) => ({
          success: true,
          data: [response.data, ...(current?.success ? current.data : [])],
        }),
      );
      setSelectedId(response.data.id);
      setActiveSection("journal");
      appToast.success(t("success.created"));
    },
  });
  const saveMutation = useMutation({
    mutationKey: ["journal", "save"],
    mutationFn: ({
      entryId,
      input,
    }: {
      entryId: string;
      input: UpdateJournalEntryRequest;
    }) => updateJournalEntry(entryId, input),
    onError() {
      appToast.error(t("errors.save"));
    },
    onSuccess(response) {
      if (!response.success) {
        appToast.error(getJournalErrorMessage(response.error.code, "save"));
        return;
      }

      queryClient.setQueryData<JournalEntriesResponse>(
        entriesQueryKey,
        (current) => updateEntryCache(current, response.data),
      );
      appToast.success(t("success.saved"));
    },
  });
  const favoriteMutation = useMutation({
    mutationKey: ["journal", "favorite"],
    mutationFn: ({
      entryId,
      favorite,
    }: {
      entryId: string;
      favorite: boolean;
    }) => updateJournalEntry(entryId, { favorite }),
    onError() {
      appToast.error(t("errors.save"));
    },
    onSuccess(response) {
      if (!response.success) {
        appToast.error(getJournalErrorMessage(response.error.code, "save"));
        return;
      }

      queryClient.setQueryData<JournalEntriesResponse>(
        entriesQueryKey,
        (current) => updateEntryCache(current, response.data),
      );
    },
  });
  const deleteMutation = useMutation({
    mutationKey: ["journal", "delete"],
    mutationFn: deleteJournalEntry,
    onError() {
      appToast.error(t("errors.delete"));
    },
    onSuccess(response) {
      if (!response.success) {
        appToast.error(getJournalErrorMessage(response.error.code, "delete"));
        return;
      }

      queryClient.setQueryData<JournalEntriesResponse>(
        entriesQueryKey,
        (current) => {
          if (!current?.success) {
            return current;
          }

          return {
            success: true,
            data: current.data.filter(({ id }) => id !== response.data.id),
          };
        },
      );
      setSelectedId(undefined);
      appToast.success(t("success.deleted"));
    },
  });
  const logoutMutation = useMutation({
    mutationKey: ["auth", "logout"],
    mutationFn: logout,
    onError() {
      appToast.error(tCommon("errors.network"));
    },
    onSuccess() {
      queryClient.removeQueries({ queryKey: sessionQueryKey });
      queryClient.removeQueries({ queryKey: entriesQueryKey });
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
      setSelectedId(entries.find(({ favorite }) => favorite)?.id);
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

  if (
    entriesQuery.isError ||
    (entriesQuery.data && !entriesQuery.data.success)
  ) {
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
    <>
      <Flex direction="column" height="100dvh" overflow="hidden">
        <JournalMobileHeader
          activeSection={activeSection}
          currentUser={sessionQuery.data.data.user}
          entries={entries}
          selectedId={selectedEntry?.id}
          onNewEntry={handleCreateEntry}
          onOpenSettings={() => setSettingsOpen(true)}
          onSectionChange={handleSectionChange}
          onSelectEntry={setSelectedId}
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
            onOpenSettings={() => setSettingsOpen(true)}
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
            onFilterChange={(filter) =>
              handleSectionChange(filter === "all" ? "journal" : filter)
            }
            onSelect={setSelectedId}
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
              onSave={(input) =>
                saveMutation.mutate({ entryId: selectedEntry.id, input })
              }
              onToggleFavorite={() =>
                favoriteMutation.mutate({
                  entryId: selectedEntry.id,
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
                  <Button
                    onClick={handleCreateEntry}
                    loading={createMutation.isPending}
                  >
                    <PlusIcon aria-hidden />
                    {t("empty.action")}
                  </Button>
                </Flex>
              </Card>
            </Flex>
          )}
        </Flex>
      </Flex>
      <PrivacySettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </>
  );
}
