import "server-only";

import { normalizeUsername } from "@/api/auth/auth.schema";
import type { EncryptedJournalEntry } from "@/api/journal/journal.type";
import type { ApplicationStore, PendingAccountSalt, StoredUser } from "@/server/store.type";

// TODO(review-critical-durable-store): Replace every process-local collection below with one
// durable transactional store before deployment. Vercel function instances are ephemeral and
// isolated, so accounts, sessions, pending salts, and entries currently disappear on restart and
// are inconsistent across concurrent instances. The free-tier choice must fail closed rather than
// silently falling back to memory or enabling paid overages.

type StoredSession = {
  expiresAt: number;
  userId: string;
};

export const serverStore = {
  entriesByUserId: new Map<string, EncryptedJournalEntry[]>(),
  pendingAccountSalts: new Map<string, PendingAccountSalt>(),
  sessions: new Map<string, StoredSession>(),
  users: [] as StoredUser[],
};

export const serverApplicationStore: ApplicationStore = {
  deleteJournalEntry(userId, entryId) {
    const entries = serverStore.entriesByUserId.get(userId) ?? [];
    const index = entries.findIndex(({ id }) => id === entryId);
    if (index < 0) return false;
    entries.splice(index, 1);
    return true;
  },
  deletePendingAccountSalt(username) {
    serverStore.pendingAccountSalts.delete(username);
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
  getPendingAccountSalt(username) {
    return serverStore.pendingAccountSalts.get(username);
  },
  initializeJournal(userId) {
    serverStore.entriesByUserId.set(userId, []);
  },
  insertJournalEntry(userId, entry) {
    const entries = serverStore.entriesByUserId.get(userId);
    if (!entries || entries.some(({ id }) => id === entry.id)) return false;
    entries.unshift(entry);
    return true;
  },
  insertUser(user) {
    serverStore.users.push(user);
  },
  replaceJournalEntry(userId, entry) {
    const entries = serverStore.entriesByUserId.get(userId) ?? [];
    const index = entries.findIndex(({ id }) => id === entry.id);
    if (index < 0) return false;
    entries[index] = entry;
    return true;
  },
  setPendingAccountSalt(username, pendingSalt) {
    serverStore.pendingAccountSalts.set(username, pendingSalt);
  },
};
