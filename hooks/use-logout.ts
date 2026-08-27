"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "@/api/auth/auth";
import { clearClientSession } from "@/client-state/client-session";
import { useRouter } from "@/i18n/navigation";

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const logoutMutation = useMutation({
    gcTime: 0,
    mutationFn: logout,
  });

  function signOut() {
    if (logoutMutation.isPending) {
      return;
    }

    // Drop keys and cached plaintext immediately. Server revocation may finish afterward.
    clearClientSession(queryClient);
    router.replace("/");
    logoutMutation.mutate();
  }

  return { signOut, isPending: logoutMutation.isPending };
}
