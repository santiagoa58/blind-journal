import { constants as HTTP_STATUS } from "node:http2";
import type { NextRequest } from "next/server";
import { JOURNAL_ERROR_CODES } from "@/api/journal/journal.error";
import { journalEntryIdSchema } from "@/api/journal/journal.schema";
import { REQUEST_ERROR_CODES } from "@/api/request.error";
import type { ApiErrorResponse } from "@/api/response.type";
import { MAX_FUNCTION_PAYLOAD_BYTES } from "@/api/transport.constants";
import { isSameOrigin, jsonResponse, readJsonBody, requestErrorResponse } from "@/server/http";
import { deleteEntry, updateEntry } from "@/server/journal";
import { getJournalErrorHttpStatus } from "@/server/journal.error";
import { getSessionUserId } from "@/server/session";
import { unauthorizedResponse } from "../../api-response";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ entryId: string }>;
};

function entryNotFoundResponse() {
  return jsonResponse(
    { code: JOURNAL_ERROR_CODES.entryNotFound } satisfies ApiErrorResponse<
      (typeof JOURNAL_ERROR_CODES)["entryNotFound"]
    >,
    getJournalErrorHttpStatus(JOURNAL_ERROR_CODES.entryNotFound),
  );
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isSameOrigin(request)) {
    return requestErrorResponse(REQUEST_ERROR_CODES.forbidden);
  }

  const userId = getSessionUserId(request);

  if (!userId) {
    return unauthorizedResponse();
  }

  const { entryId } = await context.params;

  if (!journalEntryIdSchema.safeParse(entryId).success) {
    return entryNotFoundResponse();
  }

  const body = await readJsonBody(request, MAX_FUNCTION_PAYLOAD_BYTES);
  if ("error" in body) {
    return requestErrorResponse(body.error);
  }

  const result = updateEntry(userId, entryId, body.data);
  return result.success
    ? jsonResponse(result.data, HTTP_STATUS.HTTP_STATUS_OK)
    : jsonResponse(result.error, getJournalErrorHttpStatus(result.error.code));
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!isSameOrigin(request)) {
    return requestErrorResponse(REQUEST_ERROR_CODES.forbidden);
  }

  const userId = getSessionUserId(request);

  if (!userId) {
    return unauthorizedResponse();
  }

  const { entryId } = await context.params;

  if (!journalEntryIdSchema.safeParse(entryId).success) {
    return entryNotFoundResponse();
  }

  const result = deleteEntry(userId, entryId);

  return result.success
    ? jsonResponse(result.data, HTTP_STATUS.HTTP_STATUS_OK)
    : jsonResponse(result.error, getJournalErrorHttpStatus(result.error.code));
}
