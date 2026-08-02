import { z } from "zod";

export const journalMoodSchema = z.enum([
  "calm",
  "hopeful",
  "reflective",
  "tired",
  "grateful",
]);

export const journalEntrySchema = z.strictObject({
  id: z.string().min(1),
  title: z.string(),
  preview: z.string(),
  body: z.string(),
  dateLabel: z.string(),
  timeLabel: z.string(),
  updatedAt: z.string(),
  favorite: z.boolean(),
  mood: journalMoodSchema,
  tags: z.array(z.string()),
  wordCount: z.number().int().nonnegative(),
});
