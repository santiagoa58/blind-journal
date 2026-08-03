import type { NextRequest } from "next/server";
import { getLoginSalt } from "@/server/auth";
import { isSameOrigin, jsonResponse, REQUEST_ERROR_CODES, readJsonBody } from "@/server/http";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return jsonResponse({ success: false, error: { code: REQUEST_ERROR_CODES.forbidden } }, 403);
  }

  const response = getLoginSalt(await readJsonBody(request, 1_024));

  return jsonResponse(response, response.success ? 200 : 401);
}
