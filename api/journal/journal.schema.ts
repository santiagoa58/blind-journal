import { z } from "zod";
import {
  JOURNAL_ENTRY_ENCRYPTION_VERSION,
  MAX_JOURNAL_ENTRY_TAG_CHARACTERS,
  MAX_JOURNAL_ENTRY_TAGS,
  MAX_JOURNAL_ENTRY_TITLE_CHARACTERS,
  MIN_JOURNAL_ENTRY_TAG_CHARACTERS,
  MIN_JOURNAL_ENTRY_TITLE_CHARACTERS,
} from "@/api/journal/journal.constants";
import type {
  ApiCreateJournalEntryRequest,
  ApiUpdateJournalEntryRequest,
  EncryptedJournalEntry,
  JournalEntryContent,
} from "@/api/journal/journal.type";

export const journalEntryIdSchema = z.uuid();

export const encryptedJournalDataSchema = z.strictObject({
  version: z.literal(JOURNAL_ENTRY_ENCRYPTION_VERSION),
  wrappedKeyBase64: z.base64(),
  ciphertextBase64: z.base64(),
  ivBase64: z.base64(),
});

export const encryptedJournalEntrySchema: z.ZodType<EncryptedJournalEntry> = z.strictObject({
  id: journalEntryIdSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  encryptedData: encryptedJournalDataSchema,
});

export const createEntryRequestSchema: z.ZodType<ApiCreateJournalEntryRequest> = z.strictObject({
  id: journalEntryIdSchema,
  encryptedData: encryptedJournalDataSchema,
});

export const updateEntryRequestSchema: z.ZodType<ApiUpdateJournalEntryRequest> = z.strictObject({
  encryptedData: encryptedJournalDataSchema,
});

export const journalEntryContentSchema: z.ZodType<JournalEntryContent> = z.strictObject({
  title: z
    .string()
    .trim()
    .min(MIN_JOURNAL_ENTRY_TITLE_CHARACTERS)
    .max(MAX_JOURNAL_ENTRY_TITLE_CHARACTERS),
  content: z.string(),
  favorite: z.boolean(),
  tags: z
    .array(
      z.string().trim().min(MIN_JOURNAL_ENTRY_TAG_CHARACTERS).max(MAX_JOURNAL_ENTRY_TAG_CHARACTERS),
    )
    .max(MAX_JOURNAL_ENTRY_TAGS),
});
