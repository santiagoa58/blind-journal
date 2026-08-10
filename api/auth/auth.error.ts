export const AUTH_ERROR_CODES = {
  usernameRequired: "AUTH_USERNAME_REQUIRED",
  usernameInvalid: "AUTH_USERNAME_INVALID",
  usernameTaken: "AUTH_USERNAME_TAKEN",
  invalidCredentials: "AUTH_INVALID_CREDENTIALS",
  unauthorized: "AUTH_UNAUTHORIZED",
} as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];
