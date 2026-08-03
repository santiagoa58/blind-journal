import "server-only";

import { JOURNAL_ERROR_CODES } from "@/api/journal/journal.error";
import { createEntryRequestSchema, updateEntryRequestSchema } from "@/api/journal/journal.schema";
import type {
  DeleteJournalEntryResponse,
  JournalEntriesResponse,
  JournalEntry,
  JournalEntryResponse,
  UpdateJournalEntryRequest,
} from "@/api/journal/journal.type";
import { serverStore } from "@/server/store";

function getEntries(userId: string): JournalEntry[] | undefined {
  return serverStore.entriesByUserId.get(userId);
}

function invalidEntryResponse(): JournalEntryResponse {
  return {
    success: false,
    error: { code: JOURNAL_ERROR_CODES.invalidEntry },
  };
}

function entryNotFoundResponse(): JournalEntryResponse {
  return {
    success: false,
    error: { code: JOURNAL_ERROR_CODES.entryNotFound },
  };
}

function getContentPreview(content: string): string {
  return content
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
}

export function listEntries(userId: string): JournalEntriesResponse {
  const entries = getEntries(userId) ?? [];

  return {
    success: true,
    data: [...entries].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
  };
}

export function createEntry(userId: string, input: unknown): JournalEntryResponse {
  const result = createEntryRequestSchema.safeParse(input);

  if (!result.success) {
    return invalidEntryResponse();
  }

  const now = new Date().toISOString();
  const entry: JournalEntry = {
    id: crypto.randomUUID(),
    title: result.data.title,
    content: result.data.content,
    preview: getContentPreview(result.data.content),
    createdAt: now,
    updatedAt: now,
    favorite: false,
    mood: "reflective",
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

export function updateEntry(userId: string, entryId: string, input: unknown): JournalEntryResponse {
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

  const updates: UpdateJournalEntryRequest = {};

  if (result.data.title !== undefined) {
    updates.title = result.data.title;
  }

  if (result.data.content !== undefined) {
    updates.content = result.data.content;
  }

  if (result.data.favorite !== undefined) {
    updates.favorite = result.data.favorite;
  }

  if (result.data.mood !== undefined) {
    updates.mood = result.data.mood;
  }

  if (result.data.tags !== undefined) {
    updates.tags = result.data.tags;
  }

  const content = updates.content ?? currentEntry.content;
  const updatedEntry: JournalEntry = {
    ...currentEntry,
    ...updates,
    preview: getContentPreview(content),
    updatedAt: new Date().toISOString(),
  };

  entries[entryIndex] = updatedEntry;

  return {
    success: true,
    data: updatedEntry,
  };
}

export function deleteEntry(userId: string, entryId: string): DeleteJournalEntryResponse {
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
