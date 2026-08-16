"use client";

import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { API_ERROR_CODES } from "@/api/error";
import { isCodedError, reportClientError } from "@/client.error";
import { useErrorMessage } from "@/i18n/error-message";

export function useAppToast() {
  const t = useTranslations("api.errors");
  const getErrorMessage = useErrorMessage();

  const error = useCallback(
    (error: unknown) => {
      const message = getErrorMessage(error);

      if (
        message === undefined ||
        (isCodedError(error) && error.code === API_ERROR_CODES.unexpected)
      ) {
        reportClientError(error);
      }

      toast.error(message ?? t("unexpected"));
    },
    [getErrorMessage, t],
  );
  const success = useCallback((message: string) => toast.success(message), []);

  return useMemo(() => ({ error, success }), [error, success]);
}
