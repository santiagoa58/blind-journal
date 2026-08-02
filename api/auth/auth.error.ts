export const AUTH_ERROR_CODES = {
  usernameRequired: "AUTH_USERNAME_REQUIRED",
  userNotFound: "AUTH_USER_NOT_FOUND",
} as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];
