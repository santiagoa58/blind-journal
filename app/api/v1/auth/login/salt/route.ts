import { constants as HTTP_STATUS } from "node:http2";
import type { NextRequest } from "next/server";
import { MAX_AUTH_REQUEST_BODY_BYTES } from "@/api/auth/auth.schema";
import { REQUEST_ERROR_CODES } from "@/api/request.error";
import { getLoginSalt } from "@/server/auth";
import { getAuthErrorHttpStatus } from "@/server/auth.error";
import { isSameOrigin, jsonResponse, readJsonBody, requestErrorResponse } from "@/server/http";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return requestErrorResponse(REQUEST_ERROR_CODES.forbidden);
  }

  const body = await readJsonBody(request, MAX_AUTH_REQUEST_BODY_BYTES);
  if ("error" in body) {
    return requestErrorResponse(body.error);
  }

  const result = getLoginSalt(body.data);

  return result.success
    ? jsonResponse(result.data, HTTP_STATUS.HTTP_STATUS_OK)
    : jsonResponse(result.error, getAuthErrorHttpStatus(result.error.code));
}
