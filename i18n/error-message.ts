"use client";

import { useTranslations } from "next-intl";
import {
  MAX_PASSWORD_LENGTH,
  MAX_USERNAME_LENGTH,
  MIN_PASSWORD_LENGTH,
} from "@/api/auth/auth.constants";
import { AUTH_ERROR_CODES, type AuthErrorCode } from "@/api/auth/auth.error";
import { AUTH_CLIENT_ERROR_CODES, type AuthClientErrorCode } from "@/api/auth/auth-client.error";
import { AUTH_WORKER_ERROR_CODES, type AuthWorkerErrorCode } from "@/api/auth/auth-worker.error";
import { API_ERROR_CODES, type ApiErrorCode } from "@/api/error";
import { JOURNAL_ERROR_CODES, type JournalErrorCode } from "@/api/journal/journal.error";
import {
  JOURNAL_CLIENT_ERROR_CODES,
  type JournalClientErrorCode,
} from "@/api/journal/journal-client.error";
import { REQUEST_ERROR_CODES, type RequestErrorCode } from "@/api/request.error";
import type { CodedError, ErrorMessageValues } from "@/client.error";

type KnownErrorCode =
  | ApiErrorCode
  | AuthClientErrorCode
  | AuthErrorCode
  | AuthWorkerErrorCode
  | JournalClientErrorCode
  | JournalErrorCode
  | RequestErrorCode;

type ErrorMessageFormatter = (values?: ErrorMessageValues) => string;

export function useErrorMessage() {
  const t = useTranslations();
  const formatters = {
    [API_ERROR_CODES.networkUnavailable]: (values) => t("api.errors.networkUnavailable", values),
    [API_ERROR_CODES.timeout]: (values) => t("api.errors.timeout", values),
    [API_ERROR_CODES.unexpected]: (values) => t("api.errors.unexpected", values),

    [AUTH_ERROR_CODES.usernameRequired]: (values) => t("auth.errors.usernameRequired", values),
    [AUTH_ERROR_CODES.usernameInvalid]: (values) =>
      t("auth.usernameRequirements", { maxLength: MAX_USERNAME_LENGTH, ...values }),
    [AUTH_ERROR_CODES.usernameTaken]: (values) => t("auth.errors.usernameTaken", values),
    [AUTH_ERROR_CODES.invalidCredentials]: (values) => t("auth.errors.invalidCredentials", values),
    [AUTH_ERROR_CODES.unauthorized]: (values) => t("auth.errors.unauthorized", values),
    [AUTH_CLIENT_ERROR_CODES.passwordRequired]: (values) =>
      t("auth.errors.passwordRequired", values),
    [AUTH_CLIENT_ERROR_CODES.passwordTooShort]: (values) =>
      t("auth.passwordRequirements", {
        maxLength: MAX_PASSWORD_LENGTH,
        minLength: MIN_PASSWORD_LENGTH,
        ...values,
      }),
    [AUTH_CLIENT_ERROR_CODES.passwordTooLong]: (values) =>
      t("auth.passwordRequirements", {
        maxLength: MAX_PASSWORD_LENGTH,
        minLength: MIN_PASSWORD_LENGTH,
        ...values,
      }),
    [AUTH_CLIENT_ERROR_CODES.passwordsMismatch]: (values) =>
      t("auth.errors.passwordsMismatch", values),
    [AUTH_WORKER_ERROR_CODES.unavailable]: (values) => t("auth.errors.unlockFailed", values),

    [JOURNAL_ERROR_CODES.invalidEntry]: (values) => t("journal.errors.invalidEntry", values),
    [JOURNAL_ERROR_CODES.entryNotFound]: (values) => t("journal.errors.entryNotFound", values),
    [JOURNAL_CLIENT_ERROR_CODES.documentTooLarge]: (values) =>
      t("journal.errors.documentTooLarge", values),
    [JOURNAL_CLIENT_ERROR_CODES.encryptionFailed]: (values) =>
      t("journal.errors.encryptionFailed", values),
    [JOURNAL_CLIENT_ERROR_CODES.decryptionFailed]: (values) =>
      t("journal.errors.decryptionFailed", values),
    [JOURNAL_CLIENT_ERROR_CODES.encryptionKeyUnavailable]: (values) =>
      t("journal.errors.encryptionKeyUnavailable", values),

    [REQUEST_ERROR_CODES.forbidden]: (values) => t("request.errors.forbidden", values),
    [REQUEST_ERROR_CODES.invalid]: (values) => t("request.errors.invalid", values),
    [REQUEST_ERROR_CODES.payloadTooLarge]: (values) => t("request.errors.payloadTooLarge", values),
    [REQUEST_ERROR_CODES.unsupportedMediaType]: (values) =>
      t("request.errors.unsupportedMediaType", values),
  } satisfies Record<KnownErrorCode, ErrorMessageFormatter>;

  return (error: CodedError): string | undefined => {
    if (!Object.hasOwn(formatters, error.code)) {
      return undefined;
    }

    return formatters[error.code as KnownErrorCode](error.values);
  };
}
