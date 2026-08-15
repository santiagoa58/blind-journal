"use client";

import { useQueryClient } from "@tanstack/react-query";
import { logout } from "@/api/auth/auth";
import { useAppToast } from "@/hooks/use-app-toast";
import { useRouter } from "@/i18n/navigation";
import { useUser } from "@/state/user.state";

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const appToast = useAppToast();

  async function signOut() {
    useUser.getState().setUser(null);
    queryClient.clear();
    router.replace("/");

    try {
      await logout();
    } catch (error) {
      appToast.error(error);
    }
  }

  return { signOut };
}
