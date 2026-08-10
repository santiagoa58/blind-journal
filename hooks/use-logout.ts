"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "@/api/auth/auth";
import { journalEntriesQueryKey } from "@/components/journal/journal-query";
import { useRouter } from "@/i18n/navigation";
import { useUser } from "@/state/user.state";

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const mutation = useMutation({
    mutationKey: ["auth", "logout"],
    mutationFn: logout,
  });

  async function signOut() {
    // TODO(auth-lock): Clear in-memory keys and private query data immediately even when remote
    // session revocation fails, while preserving a visible/retryable logout error for the user.
    try {
      await mutation.mutateAsync();
      useUser.getState().setUser(null);
      queryClient.removeQueries({ queryKey: journalEntriesQueryKey });
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
