"use client";

import { Flex, Spinner, Text } from "@radix-ui/themes";
import { type PropsWithChildren, useEffect, useState } from "react";
import { messages } from "@/messages";

const mockingEnabled = process.env["NEXT_PUBLIC_BACKEND_MODE"] !== "remote";

export function MockServiceWorkerProvider({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(!mockingEnabled);
  const [startupError, setStartupError] = useState<Error | null>(null);

  useEffect(() => {
    if (!mockingEnabled) {
      return;
    }

    let active = true;

    void import("@/mocks/browser")
      .then(({ mockWorkerReady }) => mockWorkerReady)
      .then(() => {
        if (active) {
          setReady(true);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setStartupError(
            error instanceof Error ? error : new Error("Failed to start Mock Service Worker."),
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (startupError) {
    throw startupError;
  }

  if (!ready) {
    return (
      <Flex align="center" justify="center" gap="2" minHeight="100vh">
        <Spinner aria-label={messages.common.labels.loading} />
        <Text color="gray">{messages.common.labels.loading}</Text>
      </Flex>
    );
  }

  return children;
}
