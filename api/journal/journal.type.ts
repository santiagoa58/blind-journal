import type { Base64 } from "@/api/general.type";
import type { ApiResponse } from "@/api/response.type";

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

export type ClientCreateJournalEntryRequest = {
  title: string;
  content: string;
};

export type ClientUpdateJournalEntryRequest = {
  id: string;
} & JournalEntryContent;

export type ApiCreateJournalEntryRequest = Pick<EncryptedJournalEntry, "id" | "encryptedData">;
export type ApiUpdateJournalEntryRequest = Pick<EncryptedJournalEntry, "encryptedData">;

export type ApiJournalEntriesResponse = ApiResponse<EncryptedJournalEntry[]>;
export type ApiJournalEntryResponse = ApiResponse<EncryptedJournalEntry>;
export type ClientJournalEntriesResponse = ApiResponse<JournalEntry[]>;
export type ClientJournalEntryResponse = ApiResponse<JournalEntry>;
export type ApiDeleteJournalEntryResponse = ApiResponse<{ id: string }>;
