import { constants as HTTP_STATUS } from "node:http2";
import type { NextRequest } from "next/server";
import { JOURNAL_ERROR_CODES } from "@/api/journal/journal.error";
import { journalEntryIdSchema } from "@/api/journal/journal.schema";
import { REQUEST_ERROR_CODES } from "@/api/request.error";
import type { ApiErrorResponse } from "@/api/response.type";
import { MAX_FUNCTION_PAYLOAD_BYTES } from "@/api/transport.constants";
import { getSessionUserId } from "@/server/auth/session";
import { getErrorHttpStatus } from "@/server/http/error-status";
import { isSameOrigin, readJsonBody } from "@/server/http/request";
import { jsonResponse, requestErrorResponse } from "@/server/http/response";
import { deleteEntry, updateEntry } from "@/server/journal/journal";
import { unauthorizedResponse } from "../../api-response";

type RouteContext = {
  params: Promise<{ entryId: string }>;
};

function entryNotFoundResponse() {
  return jsonResponse(
    { code: JOURNAL_ERROR_CODES.entryNotFound } satisfies ApiErrorResponse<
      (typeof JOURNAL_ERROR_CODES)["entryNotFound"]
    >,
    getErrorHttpStatus(JOURNAL_ERROR_CODES.entryNotFound),
  );
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isSameOrigin(request)) {
    return requestErrorResponse(REQUEST_ERROR_CODES.forbidden);
  }

  const userId = await getSessionUserId(request);

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

  const result = await updateEntry(userId, entryId, body.data);
  return result.success
    ? jsonResponse(result.data, HTTP_STATUS.HTTP_STATUS_OK)
    : jsonResponse(result.error, getErrorHttpStatus(result.error.code));
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!isSameOrigin(request)) {
    return requestErrorResponse(REQUEST_ERROR_CODES.forbidden);
  }

  const userId = await getSessionUserId(request);

  if (!userId) {
    return unauthorizedResponse();
  }

  const { entryId } = await context.params;

  if (!journalEntryIdSchema.safeParse(entryId).success) {
    return entryNotFoundResponse();
  }

  const result = await deleteEntry(userId, entryId);

  return result.success
    ? jsonResponse(result.data, HTTP_STATUS.HTTP_STATUS_OK)
    : jsonResponse(result.error, getErrorHttpStatus(result.error.code));
}
