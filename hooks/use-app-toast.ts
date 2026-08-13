"use client";

import { useTranslations } from "next-intl";
import { type ExternalToast, toast } from "sonner";
import { API_ERROR_CODES } from "@/api/error";
import { isCodedError, reportClientError } from "@/client.error";
import { useErrorMessage } from "@/i18n/error-message";

export function useAppToast() {
  const t = useTranslations("api.errors");
  const getErrorMessage = useErrorMessage();

  return {
    error(error: unknown, options?: ExternalToast) {
      const message = getErrorMessage(error);

      if (
        message === undefined ||
        (isCodedError(error) && error.code === API_ERROR_CODES.unexpected)
      ) {
        reportClientError(error);
      }

      return toast.error(message ?? t("unexpected"), options);
    },
    dismiss(toastId: string | number) {
      toast.dismiss(toastId);
    },
    success(message: string) {
      toast.success(message);
    },
  };
}
