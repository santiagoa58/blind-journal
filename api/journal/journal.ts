import type { ClientUser } from "@/api/auth/user.type";
import { api } from "@/api/http";
import { JOURNAL_ENTRY_UNREADABLE_REASONS } from "@/api/journal/journal.constants";
import { decryptJournalEntry, encryptJournalEntry } from "@/api/journal/journal.crypto";
import {
  deleteJournalEntryResponseSchema,
  encryptedJournalEntryRecordsSchema,
  encryptedJournalEntrySchema,
} from "@/api/journal/journal.schema";
import type {
  ApiCreateJournalEntryRequest,
  ApiUpdateJournalEntryRequest,
  ClientCreateJournalEntryRequest,
  ClientUpdateJournalEntryRequest,
  JournalEntriesResult,
} from "@/api/journal/journal.type";
import { JOURNAL_CLIENT_ERROR_CODES, JournalClientError } from "@/api/journal/journal-client.error";

async function listEncryptedJournalEntries() {
  const response = await api.get("entries", { cache: "no-store" }).json<unknown>();
  return encryptedJournalEntryRecordsSchema.parse(response);
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

export async function listJournalEntries(user: ClientUser | null): Promise<JournalEntriesResult> {
  if (!user) {
    throw new JournalClientError(JOURNAL_CLIENT_ERROR_CODES.encryptionKeyUnavailable);
  }

  const records = await listEncryptedJournalEntries();
  const results = await Promise.all(
    records.map(async (record) => {
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
    }),
  );
  const journalEntries: JournalEntriesResult = {
    entries: [],
    unreadableEntries: [],
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

export async function createJournalEntry(
  input: ClientCreateJournalEntryRequest,
  user: ClientUser | null,
) {
  if (!user) {
    throw new JournalClientError(JOURNAL_CLIENT_ERROR_CODES.encryptionKeyUnavailable);
  }

  const id = crypto.randomUUID();
  const encryptedInput = await encryptJournalEntry(user.keyEncryptionKey, user.id, id, {
    ...input,
    favorite: false,
    tags: [],
  });
  const response = await createEncryptedJournalEntry(encryptedInput);
  return decryptJournalEntry(user.keyEncryptionKey, user.id, response);
}

export async function updateJournalEntry(
  input: ClientUpdateJournalEntryRequest,
  user: ClientUser | null,
) {
  if (!user) {
    throw new JournalClientError(JOURNAL_CLIENT_ERROR_CODES.encryptionKeyUnavailable);
  }

  const { id, ...content } = input;
  const encryptedInput = await encryptJournalEntry(user.keyEncryptionKey, user.id, id, content);
  const response = await updateEncryptedJournalEntry(id, {
    encryptedData: encryptedInput.encryptedData,
  });
  return decryptJournalEntry(user.keyEncryptionKey, user.id, response);
}
