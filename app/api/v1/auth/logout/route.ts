import type { NextRequest } from "next/server";
import { REQUEST_ERROR_CODES } from "@/api/request.error";
import { endSession } from "@/server/auth/session";
import { isSameOrigin } from "@/server/http/request";
import { jsonResponse, requestErrorResponse } from "@/server/http/response";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return requestErrorResponse(REQUEST_ERROR_CODES.forbidden);
  }

  const response = jsonResponse(null);
  await endSession(request, response);

  return response;
}
