import { constants as HTTP_STATUS } from "node:http2";
import type { NextRequest } from "next/server";
import { AUTH_ERROR_CODES } from "@/api/auth/auth.error";
import { REQUEST_ERROR_CODES } from "@/api/request.error";
import type { ApiErrorResponse } from "@/api/response.type";
import { MAX_FUNCTION_PAYLOAD_BYTES } from "@/api/transport.constants";
import { getAuthErrorHttpStatus } from "@/server/auth.error";
import { isSameOrigin, jsonResponse, readJsonBody, requestErrorResponse } from "@/server/http";
import { createEntry, listEntries } from "@/server/journal";
import { getJournalErrorHttpStatus } from "@/server/journal.error";
import { getSessionUserId } from "@/server/session";

export const runtime = "nodejs";

function unauthorizedResponse() {
  return jsonResponse(
    { code: AUTH_ERROR_CODES.unauthorized } satisfies ApiErrorResponse<
      (typeof AUTH_ERROR_CODES)["unauthorized"]
    >,
    getAuthErrorHttpStatus(AUTH_ERROR_CODES.unauthorized),
  );
}

export function GET(request: NextRequest) {
  const userId = getSessionUserId(request);

  if (!userId) {
    return unauthorizedResponse();
  }

  const cursor = request.nextUrl.searchParams.get("cursor");
  const result = listEntries(userId, cursor === null ? {} : { cursor });
  return result.success
    ? jsonResponse(result.data)
    : jsonResponse(result.error, getJournalErrorHttpStatus(result.error.code));
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return requestErrorResponse(REQUEST_ERROR_CODES.forbidden);
  }

  const userId = getSessionUserId(request);

  if (!userId) {
    return unauthorizedResponse();
  }

  const body = await readJsonBody(request, MAX_FUNCTION_PAYLOAD_BYTES);
  if ("error" in body) {
    return requestErrorResponse(body.error);
  }

  const result = createEntry(userId, body.data);

  return result.success
    ? jsonResponse(result.data, HTTP_STATUS.HTTP_STATUS_CREATED)
    : jsonResponse(result.error, getJournalErrorHttpStatus(result.error.code));
}
