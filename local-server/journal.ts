import { AUTH_ERROR_CODES } from "@/api/auth/auth.error";
import { JOURNAL_ERROR_CODES } from "@/api/journal/journal.error";
import { journalEntryIdSchema } from "@/api/journal/journal.schema";
import type {
  ApiJournalEntriesResponse,
  ApiJournalEntryResponse,
} from "@/api/journal/journal.type";
import { localApplicationStore, localServerStore } from "@/local-server/store";
import { createJournalService } from "@/server/journal.service";

const journalService = createJournalService(localApplicationStore);

function unauthorizedResponse(): Response {
  return Response.json(
    {
      success: false,
      error: { code: AUTH_ERROR_CODES.unauthorized },
    } satisfies ApiJournalEntriesResponse,
    { status: 401 },
  );
}

function entryNotFoundResponse(): Response {
  return Response.json(
    {
      success: false,
      error: { code: JOURNAL_ERROR_CODES.entryNotFound },
    } satisfies ApiJournalEntryResponse,
    { status: 404 },
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
  return Response.json(result, { status: result.success ? 201 : 400 });
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
    ? 200
    : result.error.code === JOURNAL_ERROR_CODES.entryNotFound
      ? 404
      : 400;
  return Response.json(result, { status });
}

export function handleDeleteJournalEntryRequest(entryId: string): Response {
  const userId = getActiveUserId();
  if (!userId) return unauthorizedResponse();
  if (!journalEntryIdSchema.safeParse(entryId).success) return entryNotFoundResponse();
  const result = journalService.deleteEntry(userId, entryId);
  return Response.json(result, { status: result.success ? 200 : 404 });
}
