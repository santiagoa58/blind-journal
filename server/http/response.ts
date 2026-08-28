import "server-only";

import { constants as HTTP_STATUS } from "node:http2";
import { NextResponse } from "next/server";
import type { RequestErrorCode } from "@/lib/api/request.error";
import { getErrorHttpStatus } from "@/server/http/error-status";

export function jsonResponse<T>(body: T, status = HTTP_STATUS.HTTP_STATUS_OK): NextResponse<T> {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export function requestErrorResponse(code: RequestErrorCode) {
  return jsonResponse({ code }, getErrorHttpStatus(code));
}
