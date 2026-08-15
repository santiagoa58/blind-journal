import type { JOURNAL_ENTRY_UNREADABLE_REASONS } from "@/api/journal/journal.constants";
import type { Base64, Base64Url } from "@/types/base64";

export type EncryptedJournalData = {
  version: 1;
  wrappedKeyBase64: Base64;
  ciphertextBase64: Base64;
  ivBase64: Base64;
};

export type EncryptedJournalEntry = {
  id: string;
  createdAt: string;
  updatedAt: string;
  encryptedData: EncryptedJournalData;
};

export type ApiCreateJournalEntryRequest = Pick<EncryptedJournalEntry, "id" | "encryptedData">;
export type ApiUpdateJournalEntryRequest = Pick<EncryptedJournalEntry, "encryptedData">;

export type ApiJournalEntriesPage = {
  records: unknown[];
  nextCursor: Base64Url | null;
};

export type ApiDeleteJournalEntryResponse = { id: string };

export type JournalEntry = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type JournalEntryContent = Pick<JournalEntry, "title" | "content">;

export type UnreadableJournalEntryReason =
  (typeof JOURNAL_ENTRY_UNREADABLE_REASONS)[keyof typeof JOURNAL_ENTRY_UNREADABLE_REASONS];

export type UnreadableJournalEntry = {
  reason: UnreadableJournalEntryReason;
  record: unknown;
};

export type JournalEntriesResult = {
  entries: JournalEntry[];
  unreadableEntries: UnreadableJournalEntry[];
};

export type JournalEntriesPage = JournalEntriesResult & {
  nextCursor: Base64Url | null;
};

export type ClientCreateJournalEntryRequest = {
  title: string;
  content: string;
};

export type ClientUpdateJournalEntryRequest = {
  id: string;
} & JournalEntryContent;
