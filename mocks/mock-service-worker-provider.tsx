"use client";

import { Flex, Spinner, Text } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import { type PropsWithChildren, useEffect, useState } from "react";

export function MockServiceWorkerProvider({ children }: PropsWithChildren) {
  const t = useTranslations("common");
  const startupErrorMessage = t("errors.mockServerStartup");
  const [ready, setReady] = useState(false);
  const [startupError, setStartupError] = useState<Error | null>(null);

  useEffect(() => {
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
          setStartupError(new Error(startupErrorMessage, { cause: error }));
        }
      });

    return () => {
      active = false;
    };
  }, [startupErrorMessage]);

  if (startupError) {
    throw startupError;
  }

  if (!ready) {
    return (
      <Flex align="center" justify="center" gap="2" minHeight="100vh">
        <Spinner aria-label={t("labels.loading")} />
        <Text color="gray">{t("labels.loading")}</Text>
      </Flex>
    );
  }

  return children;
}
