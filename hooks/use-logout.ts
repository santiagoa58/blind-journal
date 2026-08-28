"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clearClientSession } from "@/client-state/client-session";
import { useRouter } from "@/i18n/navigation";
import { logout } from "@/lib/api/auth/auth";

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const logoutMutation = useMutation({
    gcTime: 0,
    mutationFn: logout,
  });

  function signOut() {
    // Drop keys and cached plaintext immediately. Server revocation may finish afterward.
    clearClientSession(queryClient);
    router.replace("/");
    logoutMutation.mutate();
  }

  return { signOut };
}
