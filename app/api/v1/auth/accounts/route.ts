import { constants as HTTP_STATUS } from "node:http2";
import type { NextRequest } from "next/server";
import { MAX_AUTH_REQUEST_BODY_BYTES } from "@/api/auth/auth.schema";
import { REQUEST_ERROR_CODES } from "@/api/request.error";
import { createAccount } from "@/server/auth";
import { getAuthErrorHttpStatus } from "@/server/auth.error";
import { isSameOrigin, jsonResponse, readJsonBody, requestErrorResponse } from "@/server/http";
import { startSession } from "@/server/session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return requestErrorResponse(REQUEST_ERROR_CODES.forbidden);
  }

  const body = await readJsonBody(request, MAX_AUTH_REQUEST_BODY_BYTES);
  if ("error" in body) {
    return requestErrorResponse(body.error);
  }

  const result = await createAccount(body.data);
  if (!result.success) {
    return jsonResponse(result.error, getAuthErrorHttpStatus(result.error.code));
  }

  const response = jsonResponse(result.data, HTTP_STATUS.HTTP_STATUS_CREATED);
  startSession(response, result.data.user.id);
  return response;
}
