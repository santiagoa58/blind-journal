import "server-only";

import type { EncryptedJournalEntry } from "@/api/journal/journal.type";
import type { ApplicationStore, PendingAccountSalt, StoredUser } from "@/server/store.type";

type StoredSession = {
  expiresAt: number;
  userId: string;
};

const developmentUser = {
  id: "00000000-0000-4000-8000-000000000001",
  username: "test_user",
  displayName: "Test User",
  salt: "dGVzdC1zYWx0LTEyMzQ1Ng==",
  authKeyHash: "sVjCRFs1/30yYjPMGCVr7cNWA+uycpwGHXd44KIjB3Q=",
} satisfies StoredUser;

const developmentUsers = process.env.NODE_ENV === "development" ? [developmentUser] : [];
const developmentEntries = new Map<string, EncryptedJournalEntry[]>();

if (process.env.NODE_ENV === "development") {
  developmentEntries.set(developmentUser.id, []);
}

export const serverStore = {
  entriesByUserId: developmentEntries,
  pendingAccountSalts: new Map<string, PendingAccountSalt>(),
  sessions: new Map<string, StoredSession>(),
  users: developmentUsers as StoredUser[],
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
    const normalizedUsername = username.toLowerCase();
    return serverStore.users.find((user) => user.username.toLowerCase() === normalizedUsername);
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
