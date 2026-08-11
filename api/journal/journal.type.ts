import type { JOURNAL_ENTRY_UNREADABLE_REASONS } from "@/api/journal/journal.constants";
import type { Base64 } from "@/types/base64";

export type EncryptedJournalData = {
  version: 1;
  wrappedKeyBase64: Base64;
  ciphertextBase64: Base64;
  ivBase64: Base64;
};

// TODO(review-medium-replay-contract): The README says revisions are authenticated, but the
// envelope has no revision and the AAD cannot detect a replay of an older valid envelope for the
// same user and entry. Either define and implement rollback protection (including its client trust
// anchor) or explicitly remove that guarantee from the protocol documentation.

export type EncryptedJournalEntry = {
  id: string;
  createdAt: string;
  updatedAt: string;
  encryptedData: EncryptedJournalData;
};

export type ApiCreateJournalEntryRequest = Pick<EncryptedJournalEntry, "id" | "encryptedData">;
export type ApiUpdateJournalEntryRequest = Pick<EncryptedJournalEntry, "encryptedData">;

export type ApiDeleteJournalEntryResponse = { id: string };

export type JournalEntry = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  favorite: boolean;
  tags: string[];
};

export type JournalEntryContent = Pick<JournalEntry, "title" | "content" | "favorite" | "tags">;

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

export type ClientCreateJournalEntryRequest = {
  title: string;
  content: string;
};

export type ClientUpdateJournalEntryRequest = {
  id: string;
} & JournalEntryContent;
