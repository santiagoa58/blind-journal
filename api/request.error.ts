export const REQUEST_ERROR_CODES = {
  forbidden: "REQUEST_FORBIDDEN",
  invalid: "REQUEST_INVALID",
} as const;

export type RequestErrorCode = (typeof REQUEST_ERROR_CODES)[keyof typeof REQUEST_ERROR_CODES];
