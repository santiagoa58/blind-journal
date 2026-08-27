import "client-only";

import type { QueryClient } from "@tanstack/react-query";
import { useAppSession } from "@/client-state/app-session.state";

/** Clears every client-owned part of an authenticated session. */
export function clearClientSession(queryClient: QueryClient): boolean {
  const sessionState = useAppSession.getState();
  const hadActiveSession = sessionState.session.status !== "signed-out";

  sessionState.signOut();
  queryClient.clear();

  return hadActiveSession;
}
