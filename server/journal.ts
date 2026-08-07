import "server-only";

import { JOURNAL_ERROR_CODES } from "@/api/journal/journal.error";
import { createEntryRequestSchema, updateEntryRequestSchema } from "@/api/journal/journal.schema";
import type {
  ApiDeleteJournalEntryResponse,
  ApiJournalEntriesResponse,
  ApiJournalEntryResponse,
  JournalEntry,
} from "@/api/journal/journal.type";
import { serverStore } from "@/server/store";

function getEntries(userId: string): JournalEntry[] | undefined {
  return serverStore.entriesByUserId.get(userId);
}

function invalidEntryResponse(): ApiJournalEntryResponse {
  return {
    success: false,
    error: { code: JOURNAL_ERROR_CODES.invalidEntry },
  };
}

function entryNotFoundResponse(): ApiJournalEntryResponse {
  return {
    success: false,
    error: { code: JOURNAL_ERROR_CODES.entryNotFound },
  };
}

export function listEntries(userId: string): ApiJournalEntriesResponse {
  const entries = getEntries(userId) ?? [];

  return {
    success: true,
    data: [...entries].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
  };
}

export function createEntry(userId: string, input: unknown): ApiJournalEntryResponse {
  const result = createEntryRequestSchema.safeParse(input);

  if (!result.success) {
    return invalidEntryResponse();
  }

  const now = new Date().toISOString();
  const entry: JournalEntry = {
    id: crypto.randomUUID(),
    title: result.data.title,
    content: result.data.content,
    createdAt: now,
    updatedAt: now,
    favorite: false,
    tags: [],
  };

  const entries = getEntries(userId) ?? [];
  entries.unshift(entry);
  serverStore.entriesByUserId.set(userId, entries);

  return {
    success: true,
    data: entry,
  };
}

export function updateEntry(
  userId: string,
  entryId: string,
  input: unknown,
): ApiJournalEntryResponse {
  const result = updateEntryRequestSchema.safeParse(input);

  if (!result.success) {
    return invalidEntryResponse();
  }

  const entries = getEntries(userId) ?? [];
  const entryIndex = entries.findIndex(({ id }) => id === entryId);
  const currentEntry = entries[entryIndex];

  if (!currentEntry) {
    return entryNotFoundResponse();
  }

  const updatedEntry: JournalEntry = {
    ...result.data,
    ...currentEntry,
    updatedAt: new Date().toISOString(),
  };

  entries[entryIndex] = updatedEntry;

  return {
    success: true,
    data: updatedEntry,
  };
}

export function deleteEntry(userId: string, entryId: string): ApiDeleteJournalEntryResponse {
  const entries = getEntries(userId) ?? [];
  const entryIndex = entries.findIndex(({ id }) => id === entryId);

  if (entryIndex < 0) {
    return {
      success: false,
      error: { code: JOURNAL_ERROR_CODES.entryNotFound },
    };
  }

  entries.splice(entryIndex, 1);

  return {
    success: true,
    data: { id: entryId },
  };
}
