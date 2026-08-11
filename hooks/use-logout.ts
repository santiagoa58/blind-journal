"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "@/api/auth/auth";
import { journalEntriesQueryRootKey } from "@/components/journal/journal-query";
import { useRouter } from "@/i18n/navigation";
import { useJournalWorkspace } from "@/state/journal-workspace.state";
import { useUser } from "@/state/user.state";

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const mutation = useMutation({
    mutationKey: ["auth", "logout"],
    mutationFn: logout,
  });

  async function signOut() {
    // TODO(review-critical-local-lock): Clear in-memory keys and private query data immediately even
    // when remote session revocation fails, while preserving a visible/retryable logout error for
    // the user. A failed network request must not leave an explicitly locked journal readable.
    try {
      await mutation.mutateAsync();
      useUser.getState().setUser(null);
      useJournalWorkspace.getState().reset();
      queryClient.removeQueries({ queryKey: journalEntriesQueryRootKey });
      router.replace("/");
    } catch {
      // The shared MutationCache presents the localized error.
    }
  }

  return {
    isPending: mutation.isPending,
    signOut,
  };
}
