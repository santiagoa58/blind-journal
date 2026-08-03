import type { ApiResponse } from "@/api/response.type";

export type JournalMood = "calm" | "hopeful" | "reflective" | "tired" | "grateful";

export type JournalEntry = {
  id: string;
  title: string;
  content: string;
  preview: string;
  createdAt: string;
  updatedAt: string;
  favorite: boolean;
  mood: JournalMood;
  tags: string[];
  wordCount: number;
};

export type CreateJournalEntryRequest = {
  title: string;
  content: string;
};

export type UpdateJournalEntryRequest = {
  title?: string;
  content?: string;
  favorite?: boolean;
  mood?: JournalMood;
  tags?: string[];
};

export type JournalEntriesResponse = ApiResponse<JournalEntry[]>;
export type JournalEntryResponse = ApiResponse<JournalEntry>;
export type DeleteJournalEntryResponse = ApiResponse<{ id: string }>;
