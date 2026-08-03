import type { NextRequest } from "next/server";
import type { LogoutResponse } from "@/api/auth/auth.type";
import { isSameOrigin, jsonResponse, REQUEST_ERROR_CODES } from "@/server/http";
import { endSession } from "@/server/session";

export const runtime = "nodejs";

export function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return jsonResponse({ success: false, error: { code: REQUEST_ERROR_CODES.forbidden } }, 403);
  }

  const body = { success: true, data: null } satisfies LogoutResponse;
  const response = jsonResponse(body);
  endSession(request, response);

  return response;
}
