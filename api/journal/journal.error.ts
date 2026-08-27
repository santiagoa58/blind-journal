export const JOURNAL_ERROR_CODES = {
  invalidEntry: "JOURNAL_INVALID_ENTRY",
  entryAlreadyExists: "JOURNAL_ENTRY_ALREADY_EXISTS",
  entryNotFound: "JOURNAL_ENTRY_NOT_FOUND",
  storageQuotaExceeded: "JOURNAL_STORAGE_QUOTA_EXCEEDED",
} as const;

export type JournalErrorCode = (typeof JOURNAL_ERROR_CODES)[keyof typeof JOURNAL_ERROR_CODES];
