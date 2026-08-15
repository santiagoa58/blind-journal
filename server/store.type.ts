import type { AuthKeyScheduleVersion } from "@/api/auth/auth-key-schedule";
import type { ApiUser } from "@/api/auth/user.type";
import type { EncryptedJournalEntry } from "@/api/journal/journal.type";
import type { Base64, Base64Url } from "@/types/base64";

export type StoredUser = ApiUser & {
  authKeyHash: Base64;
  keyScheduleVersion: AuthKeyScheduleVersion;
  salt: Base64;
};

export type JournalEntriesPageRecord = {
  entries: EncryptedJournalEntry[];
  nextCursor: Base64Url | null;
};

// TODO(review-high-persistence-contract): Redesign this boundary for asynchronous, atomic database
// operations before selecting the adapter. Registration must enforce normalized-username
// uniqueness and create the user/session/journal consistently; journal writes must be owner-scoped
// and concurrency-safe instead of composing synchronous reads and writes in services.
export interface ApplicationStore {
  // Atomically enforces normalized-username uniqueness and initializes the user's journal.
  createUser(user: StoredUser): boolean;
  deleteJournalEntry(userId: string, entryId: string): boolean;
  findUserById(userId: string): StoredUser | undefined;
  findUserByUsername(username: string): StoredUser | undefined;
  getJournalEntries(userId: string): EncryptedJournalEntry[];
  getJournalEntriesPage(
    userId: string,
    cursor: Base64Url | undefined,
    pageSize: number,
  ): JournalEntriesPageRecord | undefined;
  insertJournalEntry(userId: string, entry: EncryptedJournalEntry): boolean;
  replaceJournalEntry(userId: string, entry: EncryptedJournalEntry): boolean;
}
