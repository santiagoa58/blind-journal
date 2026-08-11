"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { CodedError } from "@/client.error";
import { useErrorMessage } from "@/i18n/error-message";

export function useAppToast() {
  const t = useTranslations("api.errors");
  const getErrorMessage = useErrorMessage();

  return {
    error(error: CodedError) {
      const message = getErrorMessage(error);

      // TODO(review-medium-unmapped-toast-code): Report unmapped error codes before showing this
      // intentional localized fallback; otherwise a broken server/client contract is invisible.
      toast.error(message ?? t("unexpected"));
    },
    success(message: string) {
      toast.success(message);
    },
  };
}
