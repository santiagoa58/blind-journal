const BYTES_PER_MEBIBYTE = 1_024 * 1_024;

// Selects the encrypted-envelope format and authenticated metadata rules used to decrypt an entry.
export const JOURNAL_ENTRY_ENCRYPTION_VERSION = 1 as const;
export const JOURNAL_ENTRY_UNREADABLE_REASONS = {
  decryptionFailed: "decryption-failed",
  invalidEnvelope: "invalid-envelope",
} as const;
// Bounds each API response and the amount of decryption work initiated by one page fetch.
export const JOURNAL_ENTRIES_PAGE_SIZE = 20;
// Limits concurrent browser crypto work while a page of encrypted entries is being opened.
export const MAX_CONCURRENT_JOURNAL_ENTRY_DECRYPTIONS = 4;
// Leaves measured room for encryption, Base64, and JSON within Vercel's 4.5 MB function limit.
export const MAX_JOURNAL_ENTRY_PLAINTEXT_MEBIBYTES = 3;
export const MAX_JOURNAL_ENTRY_PLAINTEXT_BYTES =
  MAX_JOURNAL_ENTRY_PLAINTEXT_MEBIBYTES * BYTES_PER_MEBIBYTE;

export const MIN_JOURNAL_ENTRY_TITLE_CHARACTERS = 1;
export const MAX_JOURNAL_ENTRY_TITLE_CHARACTERS = 120;
