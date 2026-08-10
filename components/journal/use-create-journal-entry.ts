"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { createJournalEntry } from "@/api/journal/journal";
import type { JournalEntry } from "@/api/journal/journal.type";
import { useAppToast } from "@/hooks/use-app-toast";
import { useUser } from "@/state/user.state";
import { journalEntriesQueryKey } from "./journal-query";
import { useJournalWorkspace } from "./journal-workspace-context";

export function useCreateJournalEntry() {
  const user = useUser((state) => state.user);
  const queryClient = useQueryClient();
  const t = useTranslations("journal");
  const appToast = useAppToast();
  const workspace = useJournalWorkspace();
  const mutation = useMutation({
    mutationKey: ["journal", "create"],
    mutationFn: () =>
      createJournalEntry(
        {
          title: t("newEntry.title"),
          content: t("newEntry.content"),
        },
        user,
      ),
  });

  async function createEntry() {
    try {
      const entry = await mutation.mutateAsync();
      queryClient.setQueryData<JournalEntry[]>(journalEntriesQueryKey, (entries) => [
        entry,
        ...(entries ?? []).filter(({ id }) => id !== entry.id),
      ]);
      workspace?.selectSection("journal");
      workspace?.selectEntry(entry.id);
      appToast.success(t("success.created"));
    } catch {
      // The shared MutationCache presents the localized error.
    }
  }

  return {
    createEntry,
    isPending: mutation.isPending,
  };
}
