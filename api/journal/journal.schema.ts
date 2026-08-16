import { z } from "zod";
import {
  JOURNAL_ENTRIES_PAGE_SIZE,
  JOURNAL_ENTRY_ENCRYPTION_VERSION,
  MAX_JOURNAL_ENTRY_PLAINTEXT_BYTES,
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
import {
  AES_GCM_AUTH_TAG_BYTES,
  AES_GCM_IV_BYTES,
  AES_KW_WRAPPED_KEY_BYTES,
} from "@/crypto/encrypt.constants";
import type { Base64Url } from "@/types/base64";

export const journalEntryIdSchema = z.uuid();

const BASE64_CHARACTERS_PER_BLOCK = 4;
const DECODED_BYTES_PER_BASE64_BLOCK = 3;
const TRAILING_BASE64_PADDING = /=+$/;

// Avoid allocating decoded data when validation only needs its byte length.
function decodedBase64ByteLength(value: string) {
  const paddingCharacterCount = value.match(TRAILING_BASE64_PADDING)?.[0].length ?? 0;
  const blockCount = value.length / BASE64_CHARACTERS_PER_BLOCK;
  return blockCount * DECODED_BYTES_PER_BASE64_BLOCK - paddingCharacterCount;
}

const wrappedKeySchema = z
  .base64()
  .refine(
    (value) => decodedBase64ByteLength(value) === AES_KW_WRAPPED_KEY_BYTES,
    `Expected a ${AES_KW_WRAPPED_KEY_BYTES}-byte wrapped key`,
  );
const initializationVectorSchema = z
  .base64()
  .refine(
    (value) => decodedBase64ByteLength(value) === AES_GCM_IV_BYTES,
    `Expected a ${AES_GCM_IV_BYTES}-byte IV`,
  );
const ciphertextSchema = z.base64().refine((value) => {
  const length = decodedBase64ByteLength(value);
  return (
    length >= AES_GCM_AUTH_TAG_BYTES &&
    length <= MAX_JOURNAL_ENTRY_PLAINTEXT_BYTES + AES_GCM_AUTH_TAG_BYTES
  );
}, "Ciphertext is outside the supported size range");

export const encryptedJournalDataSchema = z.strictObject({
  version: z.literal(JOURNAL_ENTRY_ENCRYPTION_VERSION),
  wrappedKeyBase64: wrappedKeySchema,
  ciphertextBase64: ciphertextSchema,
  ivBase64: initializationVectorSchema,
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
