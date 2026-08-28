import type { ClientUser } from "@/lib/api/auth/user.type";
import { api } from "@/lib/api/http";
import {
  JOURNAL_ENTRY_UNREADABLE_REASONS,
  MAX_CONCURRENT_JOURNAL_ENTRY_DECRYPTIONS,
} from "@/lib/api/journal/journal.constants";
import { decryptJournalEntry, encryptJournalEntry } from "@/lib/api/journal/journal.crypto";
import {
  deleteJournalEntryResponseSchema,
  encryptedJournalEntrySchema,
  journalEntriesPageSchema,
} from "@/lib/api/journal/journal.schema";
import type {
  ApiCreateJournalEntryRequest,
  ApiUpdateJournalEntryRequest,
  ClientCreateJournalEntryRequest,
  ClientUpdateJournalEntryRequest,
  JournalEntriesPage,
} from "@/lib/api/journal/journal.type";
import {
  JOURNAL_CLIENT_ERROR_CODES,
  JournalClientError,
} from "@/lib/api/journal/journal-client.error";
import type { Base64Url } from "@/types/base64";

async function listEncryptedJournalEntries(cursor: Base64Url | null, signal?: AbortSignal) {
  const response = await api
    .get("entries", {
      cache: "no-store",
      ...(signal ? { signal } : {}),
      ...(cursor ? { searchParams: { cursor } } : {}),
    })
    .json<unknown>();
  return journalEntriesPageSchema.parse(response);
}

async function createEncryptedJournalEntry(input: ApiCreateJournalEntryRequest) {
  const response = await api.post("entries", { cache: "no-store", json: input }).json<unknown>();
  return encryptedJournalEntrySchema.parse(response);
}

async function updateEncryptedJournalEntry(entryId: string, input: ApiUpdateJournalEntryRequest) {
  const response = await api
    .patch(`entries/${entryId}`, { cache: "no-store", json: input })
    .json<unknown>();
  return encryptedJournalEntrySchema.parse(response);
}

export async function deleteJournalEntry(entryId: string) {
  const response = await api.delete(`entries/${entryId}`, { cache: "no-store" }).json<unknown>();
  return deleteJournalEntryResponseSchema.parse(response);
}

async function mapWithConcurrency<TInput, TOutput>(
  inputs: readonly TInput[],
  concurrency: number,
  operation: (input: TInput) => Promise<TOutput>,
  signal?: AbortSignal,
): Promise<TOutput[]> {
  const results: TOutput[] = [];

  for (let index = 0; index < inputs.length; index += concurrency) {
    signal?.throwIfAborted();
    const batch = inputs.slice(index, index + concurrency);
    results.push(...(await Promise.all(batch.map(operation))));
  }

  return results;
}

export async function listJournalEntriesPage(
  user: ClientUser,
  cursor: Base64Url | null,
  signal?: AbortSignal,
): Promise<JournalEntriesPage> {
  const page = await listEncryptedJournalEntries(cursor, signal);
  const results = await mapWithConcurrency(
    page.records,
    MAX_CONCURRENT_JOURNAL_ENTRY_DECRYPTIONS,
    async (record) => {
      signal?.throwIfAborted();
      const parsedEntry = encryptedJournalEntrySchema.safeParse(record);
      if (!parsedEntry.success) {
        return {
          status: "unreadable" as const,
          unreadableEntry: {
            reason: JOURNAL_ENTRY_UNREADABLE_REASONS.invalidEnvelope,
            record,
          },
        };
      }

      try {
        return {
          status: "readable" as const,
          entry: await decryptJournalEntry(user.keyEncryptionKey, user.id, parsedEntry.data),
        };
      } catch (error) {
        if (
          !(error instanceof JournalClientError) ||
          error.code !== JOURNAL_CLIENT_ERROR_CODES.decryptionFailed
        ) {
          throw error;
        }

        return {
          status: "unreadable" as const,
          unreadableEntry: {
            reason: JOURNAL_ENTRY_UNREADABLE_REASONS.decryptionFailed,
            record,
          },
        };
      }
    },
    signal,
  );
  const journalEntries: JournalEntriesPage = {
    entries: [],
    unreadableEntries: [],
    nextCursor: page.nextCursor,
  };

  for (const result of results) {
    if (result.status === "readable") {
      journalEntries.entries.push(result.entry);
    } else {
      journalEntries.unreadableEntries.push(result.unreadableEntry);
    }
  }

  return journalEntries;
}

export async function createJournalEntry(input: ClientCreateJournalEntryRequest, user: ClientUser) {
  const id = crypto.randomUUID();
  const encryptedInput = await encryptJournalEntry(user.keyEncryptionKey, user.id, id, input);
  const response = await createEncryptedJournalEntry(encryptedInput);
  return decryptJournalEntry(user.keyEncryptionKey, user.id, response);
}

export async function updateJournalEntry(input: ClientUpdateJournalEntryRequest, user: ClientUser) {
  const { id, ...content } = input;
  const encryptedInput = await encryptJournalEntry(user.keyEncryptionKey, user.id, id, content);
  const response = await updateEncryptedJournalEntry(id, {
    encryptedData: encryptedInput.encryptedData,
  });
  return decryptJournalEntry(user.keyEncryptionKey, user.id, response);
}
