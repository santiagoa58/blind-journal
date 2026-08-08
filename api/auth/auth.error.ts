export const AUTH_ERROR_CODES = {
  usernameRequired: "AUTH_USERNAME_REQUIRED",
  usernameInvalid: "AUTH_USERNAME_INVALID",
  usernameTaken: "AUTH_USERNAME_TAKEN",
  passwordRequired: "AUTH_PASSWORD_REQUIRED",
  passwordTooShort: "AUTH_PASSWORD_TOO_SHORT",
  passwordsMismatch: "AUTH_PASSWORDS_MISMATCH",
  invalidCredentials: "AUTH_INVALID_CREDENTIALS",
  unauthorized: "AUTH_UNAUTHORIZED",
} as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];

export const AUTH_CLIENT_ERROR_CODES = {
  unavailable: "AUTH_CLIENT_UNAVAILABLE",
} as const;

export function isAuthClientError(error: unknown): boolean {
  return error instanceof Error && error.message === AUTH_CLIENT_ERROR_CODES.unavailable;
}
