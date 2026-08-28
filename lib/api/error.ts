export const API_ERROR_CODES = {
  networkUnavailable: "API_NETWORK_UNAVAILABLE",
  timeout: "API_TIMEOUT",
  unexpected: "API_UNEXPECTED",
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];
