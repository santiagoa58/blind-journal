"use client";

import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Callout } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import { useErrorMessage } from "@/i18n/error-message";
import { AUTH_ERROR_CODES } from "@/lib/api/auth/auth.error";
import { AUTH_CLIENT_ERROR_CODES } from "@/lib/api/auth/auth-client.error";
import { AUTH_WORKER_ERROR_CODES } from "@/lib/api/auth/worker/auth-worker.error";
import { API_ERROR_CODES } from "@/lib/api/error";
import { isCodedError, reportClientError } from "@/lib/client.error";

export const AUTH_FORM_ERROR_ID = "auth-form-error";

type AuthFlow = "sign-in" | "create-account" | "unlock";

export type AuthFormFailure = {
  message: string;
  fields: readonly string[];
  focusField?: string;
};

function fieldsForError(
  error: unknown,
  flow: AuthFlow,
): Pick<AuthFormFailure, "fields" | "focusField"> {
  if (!isCodedError(error)) return { fields: [] };

  switch (error.code) {
    case AUTH_ERROR_CODES.usernameRequired:
    case AUTH_ERROR_CODES.usernameInvalid:
      return { fields: ["username"], focusField: "username" };
    case AUTH_CLIENT_ERROR_CODES.passwordRequired:
    case AUTH_CLIENT_ERROR_CODES.passwordTooShort:
    case AUTH_CLIENT_ERROR_CODES.passwordTooLong:
    case AUTH_WORKER_ERROR_CODES.unavailable:
      return { fields: ["password"], focusField: "password" };
    case AUTH_CLIENT_ERROR_CODES.passwordsMismatch:
      return { fields: ["confirmPassword"], focusField: "confirmPassword" };
    case AUTH_ERROR_CODES.invalidCredentials:
      if (flow === "sign-in") {
        return { fields: ["username", "password"], focusField: "password" };
      }
      if (flow === "unlock") {
        return { fields: ["password"], focusField: "password" };
      }
      return { fields: [] };
    default:
      return { fields: [] };
  }
}

export function useAuthFormFailure(flow: AuthFlow) {
  const getErrorMessage = useErrorMessage();
  const t = useTranslations("api.errors");

  return (error: unknown): AuthFormFailure => {
    const message = getErrorMessage(error);
    if (
      message === undefined ||
      (isCodedError(error) && error.code === API_ERROR_CODES.unexpected)
    ) {
      reportClientError(error);
    }
    return { message: message ?? t("unexpected"), ...fieldsForError(error, flow) };
  };
}

export function focusAuthFormFailure(form: HTMLFormElement | null, failure: AuthFormFailure) {
  setTimeout(() => {
    const field = failure.focusField ? form?.elements.namedItem(failure.focusField) : null;
    if (field instanceof HTMLElement) {
      field.focus();
    } else {
      document.getElementById(AUTH_FORM_ERROR_ID)?.focus();
    }
  });
}

export function AuthFormError({ failure }: { failure: AuthFormFailure | null }) {
  if (!failure) return null;

  return (
    <Callout.Root id={AUTH_FORM_ERROR_ID} role="alert" color="red" tabIndex={-1}>
      <Callout.Icon>
        <ExclamationTriangleIcon aria-hidden />
      </Callout.Icon>
      <Callout.Text>{failure.message}</Callout.Text>
    </Callout.Root>
  );
}
