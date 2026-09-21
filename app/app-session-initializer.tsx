"use client";

import { Flex, Spinner, Text } from "@radix-ui/themes";
import { type PropsWithChildren, useLayoutEffect } from "react";
import { type InitialAppSession, useAppSession } from "@/client-state/app-session.state";

type AppSessionInitializerProps = PropsWithChildren<{
  initialSession: InitialAppSession;
  loadingLabel: string;
}>;

export function AppSessionInitializer({
  children,
  initialSession,
  loadingLabel,
}: AppSessionInitializerProps) {
  const initialized = useAppSession((state) => state.initialized);

  useLayoutEffect(() => {
    useAppSession.getState().initialize(initialSession);
  }, [initialSession]);

  if (!initialized) {
    return (
      <Flex role="status" align="center" justify="center" gap="3" minHeight="100dvh">
        <Spinner aria-hidden />
        <Text color="gray">{loadingLabel}</Text>
      </Flex>
    );
  }

  return children;
}
