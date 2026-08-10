import { constants as HTTP_STATUS } from "node:http2";
import { AUTH_ERROR_CODES, type AuthErrorCode } from "@/api/auth/auth.error";

const authErrorHttpStatus = {
  [AUTH_ERROR_CODES.usernameRequired]: HTTP_STATUS.HTTP_STATUS_UNPROCESSABLE_ENTITY,
  [AUTH_ERROR_CODES.usernameInvalid]: HTTP_STATUS.HTTP_STATUS_UNPROCESSABLE_ENTITY,
  [AUTH_ERROR_CODES.usernameTaken]: HTTP_STATUS.HTTP_STATUS_CONFLICT,
  [AUTH_ERROR_CODES.invalidCredentials]: HTTP_STATUS.HTTP_STATUS_UNAUTHORIZED,
  [AUTH_ERROR_CODES.unauthorized]: HTTP_STATUS.HTTP_STATUS_UNAUTHORIZED,
} satisfies Record<AuthErrorCode, number>;

export function getAuthErrorHttpStatus(code: AuthErrorCode): number {
  return authErrorHttpStatus[code];
}
