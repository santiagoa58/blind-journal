import { constants as HTTP_STATUS } from "node:http2";
import { AUTH_ERROR_CODES } from "@/api/auth/auth.error";
import { JOURNAL_ERROR_CODES } from "@/api/journal/journal.error";
import { journalEntryIdSchema } from "@/api/journal/journal.schema";
import type { ApiErrorResponse } from "@/api/response.type";
import { localApplicationStore, localServerStore } from "@/local-server/store";
import { getAuthErrorHttpStatus } from "@/server/auth.error";
import { getJournalErrorHttpStatus } from "@/server/journal.error";
import { createJournalService } from "@/server/journal.service";

// TODO(test-server): Reuse the production HTTP handler behavior as well as the journal service.
// Keep only the local storage/session replacement in this test boundary.

const journalService = createJournalService(localApplicationStore);

function unauthorizedResponse(): Response {
  return Response.json(
    { code: AUTH_ERROR_CODES.unauthorized } satisfies ApiErrorResponse<
      (typeof AUTH_ERROR_CODES)["unauthorized"]
    >,
    { status: getAuthErrorHttpStatus(AUTH_ERROR_CODES.unauthorized) },
  );
}

function entryNotFoundResponse(): Response {
  return Response.json(
    { code: JOURNAL_ERROR_CODES.entryNotFound } satisfies ApiErrorResponse<
      (typeof JOURNAL_ERROR_CODES)["entryNotFound"]
    >,
    { status: getJournalErrorHttpStatus(JOURNAL_ERROR_CODES.entryNotFound) },
  );
}

function getActiveUserId(): string | null {
  return localServerStore.activeUserId;
}

export function handleJournalEntriesRequest(): Response {
  const userId = getActiveUserId();
  return userId ? Response.json(journalService.listEntries(userId)) : unauthorizedResponse();
}

export async function handleCreateJournalEntryRequest(request: Request): Promise<Response> {
  const userId = getActiveUserId();
  if (!userId) return unauthorizedResponse();
  const result = journalService.createEntry(userId, await request.json().catch(() => null));
  return Response.json(result.success ? result.data : result.error, {
    status: result.success
      ? HTTP_STATUS.HTTP_STATUS_CREATED
      : getJournalErrorHttpStatus(result.error.code),
  });
}

export async function handleUpdateJournalEntryRequest(
  request: Request,
  entryId: string,
): Promise<Response> {
  const userId = getActiveUserId();
  if (!userId) return unauthorizedResponse();
  if (!journalEntryIdSchema.safeParse(entryId).success) return entryNotFoundResponse();
  const result = journalService.updateEntry(
    userId,
    entryId,
    await request.json().catch(() => null),
  );
  const status = result.success
    ? HTTP_STATUS.HTTP_STATUS_OK
    : getJournalErrorHttpStatus(result.error.code);
  return Response.json(result.success ? result.data : result.error, { status });
}

export function handleDeleteJournalEntryRequest(entryId: string): Response {
  const userId = getActiveUserId();
  if (!userId) return unauthorizedResponse();
  if (!journalEntryIdSchema.safeParse(entryId).success) return entryNotFoundResponse();
  const result = journalService.deleteEntry(userId, entryId);
  return Response.json(result.success ? result.data : result.error, {
    status: result.success
      ? HTTP_STATUS.HTTP_STATUS_OK
      : getJournalErrorHttpStatus(result.error.code),
  });
}
