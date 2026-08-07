import type { NextRequest } from "next/server";
import { AUTH_ERROR_CODES } from "@/api/auth/auth.error";
import type { ApiJournalEntriesResponse } from "@/api/journal/journal.type";
import { isSameOrigin, jsonResponse, REQUEST_ERROR_CODES, readJsonBody } from "@/server/http";
import { createEntry, listEntries } from "@/server/journal";
import { getSessionUserId } from "@/server/session";

export const runtime = "nodejs";

function unauthorizedResponse() {
  return jsonResponse(
    {
      success: false,
      error: { code: AUTH_ERROR_CODES.unauthorized },
    } satisfies ApiJournalEntriesResponse,
    401,
  );
}

export function GET(request: NextRequest) {
  const userId = getSessionUserId(request);

  return userId ? jsonResponse(listEntries(userId)) : unauthorizedResponse();
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return jsonResponse({ success: false, error: { code: REQUEST_ERROR_CODES.forbidden } }, 403);
  }

  const userId = getSessionUserId(request);

  if (!userId) {
    return unauthorizedResponse();
  }

  const response = createEntry(userId, await readJsonBody(request, 110_000));

  return jsonResponse(response, response.success ? 201 : 400);
}
