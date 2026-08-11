import type { NextRequest } from "next/server";
import { REQUEST_ERROR_CODES } from "@/api/request.error";
import { isSameOrigin, jsonResponse, requestErrorResponse } from "@/server/http";
import { endSession } from "@/server/session";

export const runtime = "nodejs";

export function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return requestErrorResponse(REQUEST_ERROR_CODES.forbidden);
  }

  const response = jsonResponse(null);
  endSession(request, response);

  return response;
}
