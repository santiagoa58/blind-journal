import { z } from "zod";
import type { CreateJournalEntryRequest } from "@/api/journal/journal.type";

export const journalEntryIdSchema = z.uuid();

export const createEntryRequestSchema: z.ZodType<CreateJournalEntryRequest> = z.strictObject({
  title: z.string().trim().min(1).max(120),
  content: z.string().max(100_000),
});

export const updateEntryRequestSchema = z
  .strictObject({
    title: z.string().trim().min(1).max(120).optional(),
    content: z.string().max(100_000).optional(),
    favorite: z.boolean().optional(),
    mood: z.enum(["calm", "hopeful", "reflective", "tired", "grateful"]).optional(),
    tags: z.array(z.string().trim().min(1).max(32)).max(12).optional(),
  })
  .refine((input) => Object.keys(input).length > 0);
