import { constants as HTTP_STATUS } from "node:http2";
import { REQUEST_ERROR_CODES, type RequestErrorCode } from "@/api/request.error";

const requestErrorHttpStatus = {
  [REQUEST_ERROR_CODES.forbidden]: HTTP_STATUS.HTTP_STATUS_FORBIDDEN,
  [REQUEST_ERROR_CODES.invalid]: HTTP_STATUS.HTTP_STATUS_BAD_REQUEST,
} satisfies Record<RequestErrorCode, number>;

export function getRequestErrorHttpStatus(code: RequestErrorCode): number {
  return requestErrorHttpStatus[code];
}
