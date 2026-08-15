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
import { encodeJournalEntriesCursor } from "@/server/journal-pagination";
import type { ServiceResult } from "@/server/service-result";
import type { ApplicationStore } from "@/server/store.type";

type JournalServiceResult<TData> = ServiceResult<TData, JournalErrorCode>;
const encoder = new TextEncoder();

function serializedPageSize(data: ApiJournalEntriesPage): number {
  return encoder.encode(JSON.stringify(data)).byteLength;
}

function invalidEntryResponse(): JournalServiceResult<EncryptedJournalEntry> {
  return { success: false, error: { code: JOURNAL_ERROR_CODES.invalidEntry } };
}

function entryAlreadyExistsResponse(): JournalServiceResult<EncryptedJournalEntry> {
  return { success: false, error: { code: JOURNAL_ERROR_CODES.entryAlreadyExists } };
}

function entryNotFoundResponse(): JournalServiceResult<EncryptedJournalEntry> {
  return { success: false, error: { code: JOURNAL_ERROR_CODES.entryNotFound } };
}

export function createJournalService(store: ApplicationStore) {
  function listEntries(
    userId: string,
    input: unknown,
  ): JournalServiceResult<ApiJournalEntriesPage> {
    const result = journalEntriesPageRequestSchema.safeParse(input);
    if (!result.success) {
      return { success: false, error: { code: JOURNAL_ERROR_CODES.invalidEntry } };
    }

    const page = store.getJournalEntriesPage(userId, result.data.cursor, JOURNAL_ENTRIES_PAGE_SIZE);
    if (!page) {
      return { success: false, error: { code: JOURNAL_ERROR_CODES.invalidEntry } };
    }

    const records: EncryptedJournalEntry[] = [];
    for (const entry of page.entries) {
      const moreEntriesRemain =
        records.length + 1 < page.entries.length || page.nextCursor !== null;
      const candidateRecords = [...records, entry];
      const candidate = {
        records: candidateRecords,
        nextCursor: moreEntriesRemain ? encodeJournalEntriesCursor(entry) : null,
      } satisfies ApiJournalEntriesPage;

      if (serializedPageSize(candidate) > MAX_FUNCTION_PAYLOAD_BYTES) {
        break;
      }

      records.push(entry);
    }

    const lastEntry = records.at(-1);
    if (page.entries.length > 0 && !lastEntry) {
      return { success: false, error: { code: JOURNAL_ERROR_CODES.invalidEntry } };
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

  function createEntry(
    userId: string,
    input: unknown,
  ): JournalServiceResult<EncryptedJournalEntry> {
    // TODO(review-high-storage-quota): A valid account can create unlimited near-3 MiB entries and
    // exhaust the single free database allowance for every user. Enforce an explicit per-account
    // ciphertext byte/entry quota atomically in durable persistence, return a stable domain error
    // when it is reached, and configure the provider to suspend rather than bill beyond free usage.
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
      : entryAlreadyExistsResponse();
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
