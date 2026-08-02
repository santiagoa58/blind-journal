import type { ApiResponse } from "@/api/response.type";

export type JournalMood = "calm" | "hopeful" | "reflective" | "tired" | "grateful";

export type JournalEntry = {
  id: string;
  title: string;
  preview: string;
  body: string;
  dateLabel: string;
  timeLabel: string;
  updatedAt: string;
  favorite: boolean;
  mood: JournalMood;
  tags: string[];
  wordCount: number;
};

export type JournalEntriesResponse = ApiResponse<JournalEntry[]>;
