import type { NextRequest } from "next/server";
import { REQUEST_ERROR_CODES } from "@/api/request.error";
import { isSameOrigin, jsonResponse } from "@/server/http";
import { getRequestErrorHttpStatus } from "@/server/request.error";
import { endSession } from "@/server/session";

export const runtime = "nodejs";

export function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return jsonResponse(
      { code: REQUEST_ERROR_CODES.forbidden },
      getRequestErrorHttpStatus(REQUEST_ERROR_CODES.forbidden),
    );
  }

  const response = jsonResponse(null);
  endSession(request, response);

  return response;
}
