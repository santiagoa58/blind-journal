export const REQUEST_ERROR_CODES = {
  forbidden: "REQUEST_FORBIDDEN",
  invalid: "REQUEST_INVALID",
  payloadTooLarge: "REQUEST_PAYLOAD_TOO_LARGE",
  unsupportedMediaType: "REQUEST_UNSUPPORTED_MEDIA_TYPE",
} as const;

export type RequestErrorCode = (typeof REQUEST_ERROR_CODES)[keyof typeof REQUEST_ERROR_CODES];
