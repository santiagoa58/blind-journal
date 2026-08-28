import { constants as HTTP_STATUS } from "node:http2";
import type { NextRequest } from "next/server";
import { MAX_AUTH_REQUEST_BODY_BYTES } from "@/lib/api/auth/auth.schema";
import { REQUEST_ERROR_CODES } from "@/lib/api/request.error";
import { verifyCredentials } from "@/server/auth/auth";
import { startSession } from "@/server/auth/session";
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

  const result = await verifyCredentials(body.data);
  if (!result.success) {
    return jsonResponse(result.error, getErrorHttpStatus(result.error.code));
  }

  const response = jsonResponse(result.data, HTTP_STATUS.HTTP_STATUS_OK);
  await startSession(request, response, result.data.user.id);
  return response;
}
