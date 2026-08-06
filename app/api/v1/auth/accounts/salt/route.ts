import type { NextRequest } from "next/server";
import { AUTH_ERROR_CODES } from "@/api/auth/auth.error";
import { createAccountSalt } from "@/server/auth";
import { isSameOrigin, jsonResponse, REQUEST_ERROR_CODES, readJsonBody } from "@/server/http";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return jsonResponse({ success: false, error: { code: REQUEST_ERROR_CODES.forbidden } }, 403);
  }

  const response = await createAccountSalt(await readJsonBody(request, 1_024));
  const status = response.success
    ? 201
    : response.error.code === AUTH_ERROR_CODES.usernameTaken
      ? 409
      : 400;

  return jsonResponse(response, status);
}
