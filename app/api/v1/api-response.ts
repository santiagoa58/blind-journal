import { AUTH_ERROR_CODES } from "@/api/auth/auth.error";
import type { ApiErrorResponse } from "@/api/response.type";
import { getAuthErrorHttpStatus } from "@/server/auth.error";
import { jsonResponse } from "@/server/http";

export function unauthorizedResponse() {
  return jsonResponse(
    { code: AUTH_ERROR_CODES.unauthorized } satisfies ApiErrorResponse<
      (typeof AUTH_ERROR_CODES)["unauthorized"]
    >,
    getAuthErrorHttpStatus(AUTH_ERROR_CODES.unauthorized),
  );
}
