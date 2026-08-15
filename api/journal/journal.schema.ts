import { z } from "zod";
import {
  JOURNAL_ENTRIES_PAGE_SIZE,
  JOURNAL_ENTRY_ENCRYPTION_VERSION,
  MAX_JOURNAL_ENTRY_TITLE_CHARACTERS,
  MIN_JOURNAL_ENTRY_TITLE_CHARACTERS,
} from "@/api/journal/journal.constants";
import type {
  ApiCreateJournalEntryRequest,
  ApiDeleteJournalEntryResponse,
  ApiJournalEntriesPage,
  ApiUpdateJournalEntryRequest,
  EncryptedJournalEntry,
  JournalEntryContent,
} from "@/api/journal/journal.type";
import type { Base64Url } from "@/types/base64";

export const journalEntryIdSchema = z.uuid();

// TODO(review-medium-encrypted-envelope-bounds): Validate decoded envelope lengths at this shared
// HTTP boundary: a 12-byte GCM IV, a 40-byte AES-KW-wrapped AES-256 key, and ciphertext bounded by
// the 3 MiB plaintext contract plus the authentication tag. Base64 syntax alone lets a custom API
// caller persist malformed or oversized envelopes because the plaintext check runs only in the
// browser client.
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

export const encryptedJournalEntryRecordsSchema = z
  .array(z.unknown())
  .max(JOURNAL_ENTRIES_PAGE_SIZE);

export const journalEntriesCursorSchema: z.ZodType<Base64Url> = z.base64url().max(256);

export const journalEntriesPageRequestSchema = z.strictObject({
  cursor: journalEntriesCursorSchema.optional(),
});

export const journalEntriesPageSchema: z.ZodType<ApiJournalEntriesPage> = z.strictObject({
  records: encryptedJournalEntryRecordsSchema,
  nextCursor: journalEntriesCursorSchema.nullable(),
});

export const deleteJournalEntryResponseSchema: z.ZodType<ApiDeleteJournalEntryResponse> =
  z.strictObject({
    id: journalEntryIdSchema,
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
});
