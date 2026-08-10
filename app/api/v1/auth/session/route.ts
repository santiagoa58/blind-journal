import { constants as HTTP_STATUS } from "node:http2";
import type { NextRequest } from "next/server";
import { getSession } from "@/server/auth";
import { getAuthErrorHttpStatus } from "@/server/auth.error";
import { jsonResponse } from "@/server/http";
import { getSessionUserId } from "@/server/session";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  const response = getSession(getSessionUserId(request));

  return response.success
    ? jsonResponse(response.data, HTTP_STATUS.HTTP_STATUS_OK)
    : jsonResponse(response.error, getAuthErrorHttpStatus(response.error.code));
}
