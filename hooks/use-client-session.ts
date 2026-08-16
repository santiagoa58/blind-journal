"use client";

import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { ClientUser } from "@/api/auth/user.type";
import { useUser } from "@/state/user.state";

export function clearClientSession(queryClient: QueryClient): void {
  useUser.getState().setUser(null);
  queryClient.clear();
}

export function replaceClientSession(queryClient: QueryClient, user: ClientUser): void {
  queryClient.clear();
  useUser.getState().setUser(user);
}

export function isCurrentClientSession(user: ClientUser): boolean {
  return useUser.getState().user === user;
}

export function useClientSessionActions() {
  const queryClient = useQueryClient();

  const clearSession = useCallback(() => clearClientSession(queryClient), [queryClient]);

  const replaceSession = useCallback(
    (user: ClientUser) => replaceClientSession(queryClient, user),
    [queryClient],
  );

  return { clearSession, replaceSession };
}
