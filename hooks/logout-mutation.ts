"use client";

import { useIsMutating, useMutationState } from "@tanstack/react-query";

export const logoutMutationKey = ["auth", "logout"] as const;
export const logoutErrorToastId = "auth-logout-error";

export function useLogoutUnresolved(): boolean {
  const pending = useIsMutating({ mutationKey: logoutMutationKey, exact: true }) > 0;
  const failed =
    useMutationState({
      filters: { mutationKey: logoutMutationKey, status: "error", exact: true },
      select: () => true,
    }).length > 0;

  return pending || failed;
}
