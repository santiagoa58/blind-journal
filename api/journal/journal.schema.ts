import { z } from "zod";
import type { CreateJournalEntryRequest } from "@/api/journal/journal.type";

export const journalEntryIdSchema = z.uuid();

export const createEntryRequestSchema: z.ZodType<CreateJournalEntryRequest> = z.strictObject({
  title: z.string().trim().min(1).max(255),
  content: z.string(),
});

export const updateEntryRequestSchema = z
  .strictObject({
    title: z.string().trim().min(1).max(255).optional(),
    content: z.string().optional(),
    favorite: z.boolean().optional(),
    tags: z.array(z.string().trim().min(1).max(50)).max(100).optional(),
  })
  .refine((input) => Object.keys(input).length > 0);
