import { constants as HTTP_STATUS } from "node:http2";
import type { NextRequest } from "next/server";
import { MAX_AUTH_REQUEST_BODY_BYTES } from "@/api/auth/auth.schema";
import { REQUEST_ERROR_CODES } from "@/api/request.error";
import { createAccount } from "@/server/auth";
import { getAuthErrorHttpStatus } from "@/server/auth.error";
import { isSameOrigin, jsonResponse, readJsonBody } from "@/server/http";
import { getRequestErrorHttpStatus } from "@/server/request.error";
import { startSession } from "@/server/session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return jsonResponse(
      { code: REQUEST_ERROR_CODES.forbidden },
      getRequestErrorHttpStatus(REQUEST_ERROR_CODES.forbidden),
    );
  }

  const result = await createAccount(await readJsonBody(request, MAX_AUTH_REQUEST_BODY_BYTES));
  if (!result.success) {
    return jsonResponse(result.error, getAuthErrorHttpStatus(result.error.code));
  }

  const response = jsonResponse(result.data, HTTP_STATUS.HTTP_STATUS_CREATED);
  startSession(response, result.data.user.id);
  return response;
}
