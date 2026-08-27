import { constants as HTTP_STATUS } from "node:http2";
import { AUTH_ERROR_CODES, type AuthErrorCode } from "@/api/auth/auth.error";
import { JOURNAL_ERROR_CODES, type JournalErrorCode } from "@/api/journal/journal.error";
import { REQUEST_ERROR_CODES, type RequestErrorCode } from "@/api/request.error";

type ServerErrorCode = AuthErrorCode | JournalErrorCode | RequestErrorCode;

const errorHttpStatus = {
  [AUTH_ERROR_CODES.usernameRequired]: HTTP_STATUS.HTTP_STATUS_UNPROCESSABLE_ENTITY,
  [AUTH_ERROR_CODES.usernameInvalid]: HTTP_STATUS.HTTP_STATUS_UNPROCESSABLE_ENTITY,
  [AUTH_ERROR_CODES.invalidCredentials]: HTTP_STATUS.HTTP_STATUS_UNAUTHORIZED,
  [AUTH_ERROR_CODES.unauthorized]: HTTP_STATUS.HTTP_STATUS_UNAUTHORIZED,
  [JOURNAL_ERROR_CODES.invalidEntry]: HTTP_STATUS.HTTP_STATUS_UNPROCESSABLE_ENTITY,
  [JOURNAL_ERROR_CODES.entryAlreadyExists]: HTTP_STATUS.HTTP_STATUS_CONFLICT,
  [JOURNAL_ERROR_CODES.entryNotFound]: HTTP_STATUS.HTTP_STATUS_NOT_FOUND,
  [JOURNAL_ERROR_CODES.storageQuotaExceeded]: HTTP_STATUS.HTTP_STATUS_CONFLICT,
  [REQUEST_ERROR_CODES.forbidden]: HTTP_STATUS.HTTP_STATUS_FORBIDDEN,
  [REQUEST_ERROR_CODES.invalid]: HTTP_STATUS.HTTP_STATUS_BAD_REQUEST,
  [REQUEST_ERROR_CODES.payloadTooLarge]: HTTP_STATUS.HTTP_STATUS_PAYLOAD_TOO_LARGE,
  [REQUEST_ERROR_CODES.unsupportedMediaType]: HTTP_STATUS.HTTP_STATUS_UNSUPPORTED_MEDIA_TYPE,
} satisfies Record<ServerErrorCode, number>;

export function getErrorHttpStatus(code: ServerErrorCode): number {
  return errorHttpStatus[code];
}
