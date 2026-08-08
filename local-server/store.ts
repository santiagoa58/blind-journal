import type { EncryptedJournalEntry } from "@/api/journal/journal.type";
import type { ApplicationStore, PendingAccountSalt, StoredUser } from "@/server/store.type";

type LocalServerState = {
  activeUserId: string | null;
  entriesByUserId: Record<string, EncryptedJournalEntry[]>;
  pendingAccountSalts: Record<string, PendingAccountSalt>;
  users: StoredUser[];
};

function createInitialState(): LocalServerState {
  return {
    activeUserId: null,
    users: [],
    pendingAccountSalts: {},
    entriesByUserId: {},
  };
}

export const localServerStore = createInitialState();

export const localApplicationStore: ApplicationStore = {
  deleteJournalEntry(userId, entryId) {
    const entries = localServerStore.entriesByUserId[userId] ?? [];
    const index = entries.findIndex(({ id }) => id === entryId);
    if (index < 0) return false;
    entries.splice(index, 1);
    return true;
  },
  deletePendingAccountSalt(username) {
    delete localServerStore.pendingAccountSalts[username];
  },
  findUserById(userId) {
    return localServerStore.users.find(({ id }) => id === userId);
  },
  findUserByUsername(username) {
    const normalizedUsername = username.toLowerCase();
    return localServerStore.users.find(
      (user) => user.username.toLowerCase() === normalizedUsername,
    );
  },
  getJournalEntries(userId) {
    return localServerStore.entriesByUserId[userId] ?? [];
  },
  getPendingAccountSalt(username) {
    return localServerStore.pendingAccountSalts[username];
  },
  initializeJournal(userId) {
    localServerStore.entriesByUserId[userId] = [];
  },
  insertJournalEntry(userId, entry) {
    const entries = localServerStore.entriesByUserId[userId];
    if (!entries || entries.some(({ id }) => id === entry.id)) return false;
    entries.unshift(entry);
    return true;
  },
  insertUser(user) {
    localServerStore.users.push(user);
  },
  replaceJournalEntry(userId, entry) {
    const entries = localServerStore.entriesByUserId[userId] ?? [];
    const index = entries.findIndex(({ id }) => id === entry.id);
    if (index < 0) return false;
    entries[index] = entry;
    return true;
  },
  setPendingAccountSalt(username, pendingSalt) {
    localServerStore.pendingAccountSalts[username] = pendingSalt;
  },
};

export function resetLocalServerStore() {
  const initialState = createInitialState();
  localServerStore.activeUserId = initialState.activeUserId;
  localServerStore.entriesByUserId = initialState.entriesByUserId;
  localServerStore.pendingAccountSalts = initialState.pendingAccountSalts;
  localServerStore.users = initialState.users;
}

export type { StoredUser };
