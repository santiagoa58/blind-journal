"use client";

import { useMutation } from "@tanstack/react-query";
import { logout } from "@/api/auth/auth";
import { useClientSessionActions } from "@/hooks/use-client-session";
import { useRouter } from "@/i18n/navigation";

export function useLogout() {
  const router = useRouter();
  const { clearSession } = useClientSessionActions();
  const logoutMutation = useMutation({
    gcTime: 0,
    mutationFn: logout,
    onSuccess() {
      clearSession();
      router.replace("/");
    },
  });

  function signOut() {
    logoutMutation.mutate();
  }

  return { signOut, isPending: logoutMutation.isPending };
}
