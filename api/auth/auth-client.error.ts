import { ClientError, type ClientErrorOptions } from "@/client.error";

export const AUTH_CLIENT_ERROR_CODES = {
  passwordRequired: "AUTH_CLIENT_PASSWORD_REQUIRED",
  passwordTooShort: "AUTH_CLIENT_PASSWORD_TOO_SHORT",
  passwordTooLong: "AUTH_CLIENT_PASSWORD_TOO_LONG",
  passwordsMismatch: "AUTH_CLIENT_PASSWORDS_MISMATCH",
} as const;

export type AuthClientErrorCode =
  (typeof AUTH_CLIENT_ERROR_CODES)[keyof typeof AUTH_CLIENT_ERROR_CODES];

export class AuthClientError extends ClientError<AuthClientErrorCode> {
  constructor(code: AuthClientErrorCode, options?: ClientErrorOptions) {
    super(code, options);
    this.name = "AuthClientError";
  }
}
