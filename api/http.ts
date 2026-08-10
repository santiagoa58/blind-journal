import ky, { isHTTPError, isNetworkError, isTimeoutError } from "ky";
import { API_BASE_URL } from "@/api/constants";
import { API_ERROR_CODES } from "@/api/error";
import type { CodedError } from "@/client.error";

function getApiErrorCode(data: unknown) {
  if (typeof data !== "object" || data === null || !("code" in data)) {
    return undefined;
  }

  return typeof data.code === "string" ? data.code : undefined;
}

function setErrorCode(error: Error, code: string): CodedError {
  Object.defineProperty(error, "code", {
    configurable: true,
    enumerable: true,
    value: code,
  });
  return error as CodedError;
}

export const api = ky.create({
  prefix: API_BASE_URL,
  credentials: "include",
  headers: {
    Accept: "application/json",
  },
  hooks: {
    beforeError: [
      ({ error }) => {
        if (isHTTPError(error)) {
          return setErrorCode(error, getApiErrorCode(error.data) ?? API_ERROR_CODES.unexpected);
        }

        if (isTimeoutError(error)) {
          return setErrorCode(error, API_ERROR_CODES.timeout);
        }

        if (isNetworkError(error)) {
          return setErrorCode(error, API_ERROR_CODES.networkUnavailable);
        }

        return setErrorCode(error, API_ERROR_CODES.unexpected);
      },
    ],
  },
  retry: 0,
});
