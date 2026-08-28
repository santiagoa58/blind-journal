import "server-only";

import { AUTH_ERROR_CODES } from "@/lib/api/auth/auth.error";
import type { ApiErrorResponse } from "@/lib/api/response.type";
import { getErrorHttpStatus } from "@/server/http/error-status";
import { jsonResponse } from "@/server/http/response";

export function unauthorizedResponse() {
  return jsonResponse(
    { code: AUTH_ERROR_CODES.unauthorized } satisfies ApiErrorResponse<
      (typeof AUTH_ERROR_CODES)["unauthorized"]
    >,
    getErrorHttpStatus(AUTH_ERROR_CODES.unauthorized),
  );
}
