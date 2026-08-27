import { constants as HTTP_STATUS } from "node:http2";
import type { NextRequest } from "next/server";
import { REQUEST_ERROR_CODES } from "@/api/request.error";
import { MAX_FUNCTION_PAYLOAD_BYTES } from "@/api/transport.constants";
import { getSessionUserId } from "@/server/auth/session";
import { getErrorHttpStatus } from "@/server/http/error-status";
import { isSameOrigin, readJsonBody } from "@/server/http/request";
import { jsonResponse, requestErrorResponse } from "@/server/http/response";
import { createEntry, listEntries } from "@/server/journal/journal";
import { unauthorizedResponse } from "../api-response";

export async function GET(request: NextRequest) {
  const userId = await getSessionUserId(request);

  if (!userId) {
    return unauthorizedResponse();
  }

  const cursor = request.nextUrl.searchParams.get("cursor");
  const result = await listEntries(userId, cursor === null ? {} : { cursor });
  return result.success
    ? jsonResponse(result.data)
    : jsonResponse(result.error, getErrorHttpStatus(result.error.code));
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return requestErrorResponse(REQUEST_ERROR_CODES.forbidden);
  }

  const userId = await getSessionUserId(request);

  if (!userId) {
    return unauthorizedResponse();
  }

  const body = await readJsonBody(request, MAX_FUNCTION_PAYLOAD_BYTES);
  if ("error" in body) {
    return requestErrorResponse(body.error);
  }

  const result = await createEntry(userId, body.data);

  return result.success
    ? jsonResponse(result.data, HTTP_STATUS.HTTP_STATUS_CREATED)
    : jsonResponse(result.error, getErrorHttpStatus(result.error.code));
}
