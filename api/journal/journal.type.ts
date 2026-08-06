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

export type CreateJournalEntryRequest = {
  title: string;
  content: string;
};

export type UpdateJournalEntryRequest = {
  title?: string;
  content?: string;
  favorite?: boolean;
  tags?: string[];
};

export type JournalEntriesResponse = ApiResponse<JournalEntry[]>;
export type JournalEntryResponse = ApiResponse<JournalEntry>;
export type DeleteJournalEntryResponse = ApiResponse<{ id: string }>;
