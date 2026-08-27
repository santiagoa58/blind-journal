import { constants as HTTP_STATUS } from "node:http2";
import type { NextRequest } from "next/server";
import { MAX_AUTH_REQUEST_BODY_BYTES } from "@/api/auth/auth.schema";
import { REQUEST_ERROR_CODES } from "@/api/request.error";
import { createAccount } from "@/server/auth/auth";
import { getSessionCookieName, setSessionCookie } from "@/server/auth/session";
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

  const previousSessionId = request.cookies.get(getSessionCookieName())?.value;
  const result = await createAccount(body.data, previousSessionId);
  if (!result.success) {
    return jsonResponse(result.error, getErrorHttpStatus(result.error.code));
  }

  const response = jsonResponse(result.data.apiSession, HTTP_STATUS.HTTP_STATUS_CREATED);
  setSessionCookie(response, result.data.sessionId);
  return response;
}
