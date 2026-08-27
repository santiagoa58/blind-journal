"use client";

import dynamic from "next/dynamic";
import type { PropsWithChildren } from "react";
import type { InitialAppSession } from "@/client-state/app-session.state";

const AppSessionInitializerClient = dynamic(
  () =>
    import("@/client-state/app-session.state").then(
      ({ AppSessionInitializerClient: Initializer }) => Initializer,
    ),
  { ssr: false },
);

type AppSessionInitializerProps = PropsWithChildren<{
  initialSession: InitialAppSession;
}>;

export function AppSessionInitializer({ children, initialSession }: AppSessionInitializerProps) {
  return (
    <AppSessionInitializerClient initialSession={initialSession}>
      {children}
    </AppSessionInitializerClient>
  );
}
