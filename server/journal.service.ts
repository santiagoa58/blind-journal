import { JOURNAL_ERROR_CODES, type JournalErrorCode } from "@/api/journal/journal.error";
import { createEntryRequestSchema, updateEntryRequestSchema } from "@/api/journal/journal.schema";
import type {
  ApiDeleteJournalEntryResponse,
  EncryptedJournalEntry,
} from "@/api/journal/journal.type";
import type { ServiceResult } from "@/server/service-result";
import type { ApplicationStore } from "@/server/store.type";

type JournalServiceResult<TData> = ServiceResult<TData, JournalErrorCode>;

function invalidEntryResponse(): JournalServiceResult<EncryptedJournalEntry> {
  return { success: false, error: { code: JOURNAL_ERROR_CODES.invalidEntry } };
}

function entryNotFoundResponse(): JournalServiceResult<EncryptedJournalEntry> {
  return { success: false, error: { code: JOURNAL_ERROR_CODES.entryNotFound } };
}

export function createJournalService(store: ApplicationStore) {
  function listEntries(userId: string): EncryptedJournalEntry[] {
    return store
      .getJournalEntries(userId)
      .toSorted((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  function createEntry(
    userId: string,
    input: unknown,
  ): JournalServiceResult<EncryptedJournalEntry> {
    const result = createEntryRequestSchema.safeParse(input);
    if (!result.success) {
      return invalidEntryResponse();
    }

    const now = new Date().toISOString();
    const entry: EncryptedJournalEntry = {
      id: result.data.id,
      encryptedData: result.data.encryptedData,
      createdAt: now,
      updatedAt: now,
    };

    return store.insertJournalEntry(userId, entry)
      ? { success: true, data: entry }
      : invalidEntryResponse();
  }

  function updateEntry(
    userId: string,
    entryId: string,
    input: unknown,
  ): JournalServiceResult<EncryptedJournalEntry> {
    const result = updateEntryRequestSchema.safeParse(input);
    if (!result.success) {
      return invalidEntryResponse();
    }

    const currentEntry = store.getJournalEntries(userId).find(({ id }) => id === entryId);
    if (!currentEntry) {
      return entryNotFoundResponse();
    }

    const updatedEntry: EncryptedJournalEntry = {
      ...currentEntry,
      encryptedData: result.data.encryptedData,
      updatedAt: new Date().toISOString(),
    };
    return store.replaceJournalEntry(userId, updatedEntry)
      ? { success: true, data: updatedEntry }
      : entryNotFoundResponse();
  }

  function deleteEntry(
    userId: string,
    entryId: string,
  ): JournalServiceResult<ApiDeleteJournalEntryResponse> {
    return store.deleteJournalEntry(userId, entryId)
      ? { success: true, data: { id: entryId } }
      : { success: false, error: { code: JOURNAL_ERROR_CODES.entryNotFound } };
  }

  return { createEntry, deleteEntry, listEntries, updateEntry };
}
