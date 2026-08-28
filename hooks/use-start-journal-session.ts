"use client";

import { useCallback } from "react";
import { useAppSession } from "@/client-state/app-session.state";
import { useRouter } from "@/i18n/navigation";
import type { ClientUser } from "@/lib/api/auth/user.type";

export function useStartJournalSession() {
  const router = useRouter();
  const unlock = useAppSession((state) => state.unlock);

  return useCallback(
    (user: ClientUser) => {
      unlock(user);
      router.replace("/journal");
    },
    [router, unlock],
  );
}
