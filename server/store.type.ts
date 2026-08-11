import type { ApiUser } from "@/api/auth/user.type";
import type { EncryptedJournalEntry } from "@/api/journal/journal.type";
import type { Base64 } from "@/types/base64";

export type StoredUser = ApiUser & {
  authKeyHash: Base64;
  salt: Base64;
};

export type PendingAccountSalt = {
  expiresAt: number;
  salt: Base64;
};

// TODO(review-high-persistence-contract): Redesign this boundary for asynchronous, atomic database
// operations before selecting the adapter. Registration must enforce normalized-username
// uniqueness and create the user/session/journal consistently; journal writes must be owner-scoped
// and concurrency-safe instead of composing synchronous reads and writes in services.
export interface ApplicationStore {
  deleteJournalEntry(userId: string, entryId: string): boolean;
  deletePendingAccountSalt(username: string): void;
  findUserById(userId: string): StoredUser | undefined;
  findUserByUsername(username: string): StoredUser | undefined;
  getJournalEntries(userId: string): EncryptedJournalEntry[];
  getPendingAccountSalt(username: string): PendingAccountSalt | undefined;
  initializeJournal(userId: string): void;
  insertJournalEntry(userId: string, entry: EncryptedJournalEntry): boolean;
  insertUser(user: StoredUser): void;
  replaceJournalEntry(userId: string, entry: EncryptedJournalEntry): boolean;
  setPendingAccountSalt(username: string, pendingSalt: PendingAccountSalt): void;
}
