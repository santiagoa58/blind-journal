import "server-only";

import { JOURNAL_ENTRIES_PAGE_SIZE } from "@/api/journal/journal.constants";
import { JOURNAL_ERROR_CODES, type JournalErrorCode } from "@/api/journal/journal.error";
import {
  createEntryRequestSchema,
  journalEntriesPageRequestSchema,
  updateEntryRequestSchema,
} from "@/api/journal/journal.schema";
import type {
  ApiDeleteJournalEntryResponse,
  ApiJournalEntriesPage,
  EncryptedJournalEntry,
} from "@/api/journal/journal.type";
import { MAX_FUNCTION_PAYLOAD_BYTES } from "@/api/transport.constants";
import {
  deleteJournalEntry,
  getJournalEntriesPage,
  insertJournalEntry,
  replaceJournalEntry,
} from "@/server/database/journal-entries";
import { encodeJournalEntriesCursor } from "@/server/journal/pagination";
import type { ServiceResult } from "@/server/service-result";

type JournalServiceResult<TData> = ServiceResult<TData, JournalErrorCode>;

const INVALID_ENTRY_RESPONSE = {
  success: false,
  error: { code: JOURNAL_ERROR_CODES.invalidEntry },
} as const;
function journalError(code: JournalErrorCode): JournalServiceResult<EncryptedJournalEntry> {
  return { success: false, error: { code } };
}

export async function listEntries(
  userId: string,
  input: unknown,
): Promise<JournalServiceResult<ApiJournalEntriesPage>> {
  const result = journalEntriesPageRequestSchema.safeParse(input);
  if (!result.success) {
    return INVALID_ENTRY_RESPONSE;
  }

  const page = await getJournalEntriesPage(userId, result.data.cursor, JOURNAL_ENTRIES_PAGE_SIZE);
  if (!page) {
    return INVALID_ENTRY_RESPONSE;
  }

  const records: EncryptedJournalEntry[] = [];
  for (const entry of page.entries) {
    const moreEntriesRemain = records.length + 1 < page.entries.length || page.nextCursor !== null;
    const candidateRecords = [...records, entry];
    const candidate = {
      records: candidateRecords,
      nextCursor: moreEntriesRemain ? encodeJournalEntriesCursor(entry) : null,
    } satisfies ApiJournalEntriesPage;
    const encoder = new TextEncoder();
    if (encoder.encode(JSON.stringify(candidate)).byteLength > MAX_FUNCTION_PAYLOAD_BYTES) {
      break;
    }

    records.push(entry);
  }

  const lastEntry = records.at(-1);
  if (page.entries.length > 0 && !lastEntry) {
    return INVALID_ENTRY_RESPONSE;
  }

  const moreEntriesRemain = records.length < page.entries.length || page.nextCursor !== null;
  return {
    success: true,
    data: {
      records,
      nextCursor: moreEntriesRemain && lastEntry ? encodeJournalEntriesCursor(lastEntry) : null,
    },
  };
}

export async function createEntry(
  userId: string,
  input: unknown,
): Promise<JournalServiceResult<EncryptedJournalEntry>> {
  const result = createEntryRequestSchema.safeParse(input);
  if (!result.success) {
    return journalError(JOURNAL_ERROR_CODES.invalidEntry);
  }

  const now = new Date().toISOString();
  const entry: EncryptedJournalEntry = {
    id: result.data.id,
    encryptedData: result.data.encryptedData,
    createdAt: now,
    updatedAt: now,
  };

  const writeResult = await insertJournalEntry(userId, entry);
  if (writeResult === "created") {
    return { success: true, data: entry };
  }
  return journalError(
    writeResult === "quota-exceeded"
      ? JOURNAL_ERROR_CODES.storageQuotaExceeded
      : JOURNAL_ERROR_CODES.entryAlreadyExists,
  );
}

export async function updateEntry(
  userId: string,
  entryId: string,
  input: unknown,
): Promise<JournalServiceResult<EncryptedJournalEntry>> {
  const result = updateEntryRequestSchema.safeParse(input);
  if (!result.success) {
    return journalError(JOURNAL_ERROR_CODES.invalidEntry);
  }

  const writeResult = await replaceJournalEntry(
    userId,
    entryId,
    result.data.encryptedData,
    new Date().toISOString(),
  );
  if (writeResult.status === "updated") {
    return { success: true, data: writeResult.entry };
  }
  return journalError(
    writeResult.status === "quota-exceeded"
      ? JOURNAL_ERROR_CODES.storageQuotaExceeded
      : JOURNAL_ERROR_CODES.entryNotFound,
  );
}

export async function deleteEntry(
  userId: string,
  entryId: string,
): Promise<JournalServiceResult<ApiDeleteJournalEntryResponse>> {
  return (await deleteJournalEntry(userId, entryId))
    ? { success: true, data: { id: entryId } }
    : { success: false, error: { code: JOURNAL_ERROR_CODES.entryNotFound } };
}
