import type { NextRequest } from "next/server";
import { AUTH_ERROR_CODES } from "@/api/auth/auth.error";
import { createAccount } from "@/server/auth";
import { isSameOrigin, jsonResponse, REQUEST_ERROR_CODES, readJsonBody } from "@/server/http";
import { startSession } from "@/server/session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return jsonResponse({ success: false, error: { code: REQUEST_ERROR_CODES.forbidden } }, 403);
  }

  const result = await createAccount(await readJsonBody(request, 1_024));
  const status = result.success
    ? 201
    : result.error.code === AUTH_ERROR_CODES.usernameTaken
      ? 409
      : 400;
  const response = jsonResponse(result, status);

  if (result.success) {
    startSession(response, result.data.user.id);
  }

  return response;
}
