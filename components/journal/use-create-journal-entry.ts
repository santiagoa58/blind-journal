"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { createJournalEntry } from "@/api/journal/journal";
import type { JournalEntriesResult } from "@/api/journal/journal.type";
import { useAppToast } from "@/hooks/use-app-toast";
import { useJournalWorkspace } from "@/state/journal-workspace.state";
import { useUser } from "@/state/user.state";
import { journalEntriesQueryKey } from "./journal-query";

export function useCreateJournalEntry() {
  const user = useUser((state) => state.user);
  const queryClient = useQueryClient();
  const t = useTranslations("journal");
  const appToast = useAppToast();
  // TODO(review-medium-shared-create-state): This hook is mounted by the desktop sidebar, mobile
  // header, and empty state; equal mutation keys do not share `isPending`. Coordinate through
  // TanStack's mutation cache/state (and serialize if required) so multiple visible controls cannot
  // start duplicate creates while presenting contradictory progress.
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
      if (user) {
        queryClient.setQueryData<JournalEntriesResult>(
          journalEntriesQueryKey(user.id),
          (result) => ({
            entries: [entry, ...(result?.entries ?? []).filter(({ id }) => id !== entry.id)],
            unreadableEntries: result?.unreadableEntries ?? [],
          }),
        );
      }
      const workspace = useJournalWorkspace.getState();
      workspace.selectSection("journal");
      workspace.selectEntry(entry.id);
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
