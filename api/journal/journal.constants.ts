const BYTES_PER_MEBIBYTE = 1_024 * 1_024;

export const JOURNAL_ENTRY_ENCRYPTION_VERSION = 1 as const;
export const JOURNAL_ENTRY_UNREADABLE_REASONS = {
  decryptionFailed: "decryption-failed",
  invalidEnvelope: "invalid-envelope",
} as const;
export const MAX_JOURNAL_ENTRY_PLAINTEXT_MEBIBYTES = 5;
export const MAX_JOURNAL_ENTRY_PLAINTEXT_BYTES =
  MAX_JOURNAL_ENTRY_PLAINTEXT_MEBIBYTES * BYTES_PER_MEBIBYTE;

// Base64 expands encrypted data by roughly one third. A 2x ceiling leaves ample room for the
// encryption tag and JSON envelope without coupling this transport guard to their exact format.
export const MAX_JOURNAL_ENTRY_REQUEST_BYTES = MAX_JOURNAL_ENTRY_PLAINTEXT_BYTES * 2;

export const MIN_JOURNAL_ENTRY_TITLE_CHARACTERS = 1;
export const MAX_JOURNAL_ENTRY_TITLE_CHARACTERS = 120;
export const MIN_JOURNAL_ENTRY_TAG_CHARACTERS = 1;
export const MAX_JOURNAL_ENTRY_TAG_CHARACTERS = 50;
export const MAX_JOURNAL_ENTRY_TAGS = 100;
