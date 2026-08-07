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

export type ClientCreateJournalEntryRequest = {
  title: string;
  content: string;
};

export type ClientUpdateJournalEntryRequest = {
  id: string;
  title?: string;
  content?: string;
  favorite?: boolean;
  tags?: string[];
};

export type ApiUpdateJournalEntryRequest = {
  wrappedKeyBase64: Base64;
  cipherTextBase64: Base64;
  ivBase64: Base64;
};

export type ApiCreateJournalEntryRequest = ApiUpdateJournalEntryRequest;

export type ApiJournalEntriesResponse = ApiResponse<JournalEntry[]>;
export type ApiJournalEntryResponse = ApiResponse<JournalEntry>;
export type ApiDeleteJournalEntryResponse = ApiResponse<{ id: string }>;
