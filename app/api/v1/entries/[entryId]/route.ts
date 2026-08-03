import type { NextRequest } from "next/server";
import { AUTH_ERROR_CODES } from "@/api/auth/auth.error";
import { JOURNAL_ERROR_CODES } from "@/api/journal/journal.error";
import { journalEntryIdSchema } from "@/api/journal/journal.schema";
import type { JournalEntryResponse } from "@/api/journal/journal.type";
import { isSameOrigin, jsonResponse, REQUEST_ERROR_CODES, readJsonBody } from "@/server/http";
import { deleteEntry, updateEntry } from "@/server/journal";
import { getSessionUserId } from "@/server/session";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ entryId: string }>;
};

function unauthorizedResponse() {
  return jsonResponse(
    {
      success: false,
      error: { code: AUTH_ERROR_CODES.unauthorized },
    } satisfies JournalEntryResponse,
    401,
  );
}

function entryNotFoundResponse() {
  return jsonResponse(
    {
      success: false,
      error: { code: JOURNAL_ERROR_CODES.entryNotFound },
    } satisfies JournalEntryResponse,
    404,
  );
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isSameOrigin(request)) {
    return jsonResponse({ success: false, error: { code: REQUEST_ERROR_CODES.forbidden } }, 403);
  }

  const userId = getSessionUserId(request);

  if (!userId) {
    return unauthorizedResponse();
  }

  const { entryId } = await context.params;

  if (!journalEntryIdSchema.safeParse(entryId).success) {
    return entryNotFoundResponse();
  }

  const response = updateEntry(userId, entryId, await readJsonBody(request, 110_000));
  const status = response.success
    ? 200
    : response.error.code === JOURNAL_ERROR_CODES.entryNotFound
      ? 404
      : 400;

  return jsonResponse(response, status);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!isSameOrigin(request)) {
    return jsonResponse({ success: false, error: { code: REQUEST_ERROR_CODES.forbidden } }, 403);
  }

  const userId = getSessionUserId(request);

  if (!userId) {
    return unauthorizedResponse();
  }

  const { entryId } = await context.params;

  if (!journalEntryIdSchema.safeParse(entryId).success) {
    return entryNotFoundResponse();
  }

  const response = deleteEntry(userId, entryId);

  return jsonResponse(response, response.success ? 200 : 404);
}
