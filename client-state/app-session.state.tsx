import "client-only";

import { type PropsWithChildren, useLayoutEffect } from "react";
import { create } from "zustand";
import type { ApiUser, ClientUser } from "@/lib/api/auth/user.type";

type SignedOutSession = { status: "signed-out" };
type LockedSession = { status: "locked"; user: ApiUser };
type UnlockedSession = { status: "unlocked"; user: ClientUser };

export type AppSession = SignedOutSession | LockedSession | UnlockedSession;
export type InitialAppSession = SignedOutSession | LockedSession;

export type AppSessionState = {
  initialized: boolean;
  session: AppSession;
  initialize: (session: InitialAppSession) => void;
  signOut: () => void;
  unlock: (user: ClientUser) => void;
};

export const useAppSession = create<AppSessionState>((set) => ({
  initialized: false,
  session: { status: "signed-out" },
  initialize: (session) =>
    set((state) => (state.initialized ? state : { initialized: true, session })),
  signOut: () => set({ session: { status: "signed-out" } }),
  unlock: (user) => set({ session: { status: "unlocked", user } }),
}));

type AppSessionInitializerClientProps = PropsWithChildren<{
  initialSession: InitialAppSession;
}>;

export function AppSessionInitializerClient({
  children,
  initialSession,
}: AppSessionInitializerClientProps) {
  const initialized = useAppSession((state) => state.initialized);

  useLayoutEffect(() => {
    useAppSession.getState().initialize(initialSession);
  }, [initialSession]);

  return initialized ? children : null;
}
