"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useCallback, useRef } from "react";
import type { ClientUser } from "@/api/auth/user.type";
import { createJournalEntry } from "@/api/journal/journal";
import { useAppToast } from "@/hooks/use-app-toast";
import { isCurrentClientSession } from "@/hooks/use-client-session";
import { journalEntriesQueryKey } from "./journal-query";

export function useCreateJournalEntry(user: ClientUser, onCreated: (entryId: string) => void) {
  const queryClient = useQueryClient();
  const t = useTranslations("journal");
  const appToast = useAppToast();
  const submitting = useRef(false);
  const mutation = useMutation({
    gcTime: 0,
    mutationFn: () =>
      createJournalEntry(
        {
          title: t("newEntry.title"),
          content: t("newEntry.content"),
        },
        user,
      ),
    onSuccess: async (entry) => {
      if (!isCurrentClientSession(user)) {
        return;
      }

      await queryClient.invalidateQueries({ queryKey: journalEntriesQueryKey(user.id) });

      if (!isCurrentClientSession(user)) {
        return;
      }

      onCreated(entry.id);
      appToast.success(t("success.created"));
    },
    onSettled: () => {
      submitting.current = false;
    },
  });

  const createEntry = useCallback(() => {
    if (submitting.current) {
      return;
    }

    submitting.current = true;
    mutation.mutate(undefined, {
      onSettled: () => {
        mutation.reset();
      },
    });
  }, [mutation]);

  return { createEntry, isPending: mutation.isPending || submitting.current };
}
