"use client";

import type { PropsWithChildren } from "react";
import { useAppSession } from "@/client-state/app-session.state";
import { AuthShell } from "./auth-shell";
import { UnlockCard } from "./unlock-card";

export function AppLockBoundary({ children }: PropsWithChildren) {
  const session = useAppSession((state) => state.session);

  if (session.status !== "locked") {
    return children;
  }

  return (
    <AuthShell>
      <UnlockCard user={session.user} />
    </AuthShell>
  );
}
