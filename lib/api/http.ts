import ky, { isHTTPError, isNetworkError, isTimeoutError } from "ky";
import { API_BASE_PATH } from "@/lib/api/constants";
import { API_ERROR_CODES } from "@/lib/api/error";
import { REQUEST_ID_HEADER } from "@/lib/api/observability";
import type { CodedError } from "@/lib/client.error";

function getApiErrorCode(data: unknown) {
  if (typeof data !== "object" || data === null || !("code" in data)) {
    return undefined;
  }

  return typeof data.code === "string" ? data.code : undefined;
}

function setErrorCode(error: Error, code: string, requestId?: string): CodedError {
  return Object.assign(error, {
    code,
    ...(requestId === undefined ? {} : { requestId }),
  });
}

export const api = ky.create({
  prefix: API_BASE_PATH,
  credentials: "same-origin",
  headers: {
    Accept: "application/json",
  },
  hooks: {
    beforeError: [
      ({ error }) => {
        // Cancellation belongs to the query lifecycle. DOMException.code is also read-only, so
        // attempting to decorate an AbortError would replace an expected cancellation with a
        // TypeError.
        if (error.name === "AbortError") {
          return error;
        }

        if (isHTTPError(error)) {
          return setErrorCode(
            error,
            getApiErrorCode(error.data) ?? API_ERROR_CODES.unexpected,
            error.response.headers.get(REQUEST_ID_HEADER) ?? undefined,
          );
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
  retry: {
    // One extra attempt can recover a transient read failure without delaying the UI repeatedly.
    limit: 1,
    // Never automatically repeat writes: a lost response does not prove that the server did not apply it.
    methods: ["get"],
    // A server response is definitive; retry only when the request could not complete.
    shouldRetry: ({ error }) => isNetworkError(error) || isTimeoutError(error),
  },
});
