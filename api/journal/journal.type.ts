import type { ApiResponse } from "@/api/response.type";
import type z from "zod";
import type { journalEntrySchema, journalMoodSchema } from "./journal.schema";

export type JournalEntry = z.infer<typeof journalEntrySchema>;
export type JournalMood = z.infer<typeof journalMoodSchema>;
export type JournalEntriesResponse = ApiResponse<JournalEntry[]>;
