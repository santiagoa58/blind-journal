import "server-only";

import { normalizeUsername } from "@/api/auth/auth.schema";
import type { EncryptedJournalEntry } from "@/api/journal/journal.type";
import {
  compareJournalEntries,
  decodeJournalEntriesCursor,
  encodeJournalEntriesCursor,
  entryIsAfterCursor,
} from "@/server/journal-pagination";
import type { ApplicationStore, StoredUser } from "@/server/store.type";

// TODO(review-critical-durable-store): Replace every process-local collection below with one
// durable transactional store before deployment. Vercel function instances are ephemeral and
// isolated, so accounts, sessions, and entries currently disappear on restart and
// are inconsistent across concurrent instances. The free-tier choice must fail closed rather than
// silently falling back to memory or enabling paid overages.

type StoredSession = {
  expiresAt: number;
  userId: string;
};

export const serverStore = {
  entriesByUserId: new Map<string, EncryptedJournalEntry[]>(),
  sessions: new Map<string, StoredSession>(),
  users: [] as StoredUser[],
};

export const serverApplicationStore: ApplicationStore = {
  createUser(user) {
    if (serverStore.users.some((storedUser) => storedUser.username === user.username)) {
      return false;
    }

    serverStore.users.push(user);
    serverStore.entriesByUserId.set(user.id, []);
    return true;
  },
  deleteJournalEntry(userId, entryId) {
    const entries = serverStore.entriesByUserId.get(userId) ?? [];
    const index = entries.findIndex(({ id }) => id === entryId);
    if (index < 0) return false;
    entries.splice(index, 1);
    return true;
  },
  findUserById(userId) {
    return serverStore.users.find(({ id }) => id === userId);
  },
  findUserByUsername(username) {
    const normalizedUsername = normalizeUsername(username);
    return serverStore.users.find((user) => user.username === normalizedUsername);
  },
  getJournalEntries(userId) {
    return serverStore.entriesByUserId.get(userId) ?? [];
  },
  getJournalEntriesPage(userId, cursor, pageSize) {
    const decodedCursor = cursor ? decodeJournalEntriesCursor(cursor) : undefined;
    if (cursor && !decodedCursor) {
      return undefined;
    }

    const sortedEntries = (serverStore.entriesByUserId.get(userId) ?? [])
      .toSorted(compareJournalEntries)
      .filter((entry) => !decodedCursor || entryIsAfterCursor(entry, decodedCursor));
    const entries = sortedEntries.slice(0, pageSize);
    const lastEntry = entries.at(-1);

    return {
      entries,
      nextCursor:
        sortedEntries.length > pageSize && lastEntry ? encodeJournalEntriesCursor(lastEntry) : null,
    };
  },
  insertJournalEntry(userId, entry) {
    const entries = serverStore.entriesByUserId.get(userId);
    if (!entries || entries.some(({ id }) => id === entry.id)) return false;
    entries.unshift(entry);
    return true;
  },
  replaceJournalEntry(userId, entry) {
    const entries = serverStore.entriesByUserId.get(userId) ?? [];
    const index = entries.findIndex(({ id }) => id === entry.id);
    if (index < 0) return false;
    entries[index] = entry;
    return true;
  },
};
