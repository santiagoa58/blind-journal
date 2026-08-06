import type { NextRequest } from "next/server";
import { verifyCredentials } from "@/server/auth";
import { isSameOrigin, jsonResponse, REQUEST_ERROR_CODES, readJsonBody } from "@/server/http";
import { startSession } from "@/server/session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return jsonResponse({ success: false, error: { code: REQUEST_ERROR_CODES.forbidden } }, 403);
  }

  const result = await verifyCredentials(await readJsonBody(request, 1_024));
  const response = jsonResponse(result, result.success ? 200 : 401);

  if (result.success) {
    startSession(response, result.data.user.id);
  }

  return response;
}
