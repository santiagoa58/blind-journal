import { constants as HTTP_STATUS } from "node:http2";
import type { NextRequest } from "next/server";
import { MAX_AUTH_REQUEST_BODY_BYTES } from "@/api/auth/auth.schema";
import { REQUEST_ERROR_CODES } from "@/api/request.error";
import { getAuthSalt } from "@/server/auth/auth";
import { getErrorHttpStatus } from "@/server/http/error-status";
import { isSameOrigin, readJsonBody } from "@/server/http/request";
import { jsonResponse, requestErrorResponse } from "@/server/http/response";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return requestErrorResponse(REQUEST_ERROR_CODES.forbidden);
  }

  const body = await readJsonBody(request, MAX_AUTH_REQUEST_BODY_BYTES);
  if ("error" in body) {
    return requestErrorResponse(body.error);
  }

  const result = await getAuthSalt(body.data);
  return result.success
    ? jsonResponse(result.data, HTTP_STATUS.HTTP_STATUS_OK)
    : jsonResponse(result.error, getErrorHttpStatus(result.error.code));
}
