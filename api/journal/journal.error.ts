export const JOURNAL_ERROR_CODES = {
  invalidEntry: "JOURNAL_INVALID_ENTRY",
  entryNotFound: "JOURNAL_ENTRY_NOT_FOUND",
} as const;

export type JournalErrorCode = (typeof JOURNAL_ERROR_CODES)[keyof typeof JOURNAL_ERROR_CODES];

export const JOURNAL_CLIENT_ERROR_CODES = {
  documentTooLarge: "JOURNAL_CLIENT_DOCUMENT_TOO_LARGE",
  encryptionKeyUnavailable: "JOURNAL_CLIENT_ENCRYPTION_KEY_UNAVAILABLE",
} as const;

export type JournalClientErrorCode =
  (typeof JOURNAL_CLIENT_ERROR_CODES)[keyof typeof JOURNAL_CLIENT_ERROR_CODES];

export class JournalClientError extends Error {
  readonly code: JournalClientErrorCode;

  constructor(code: JournalClientErrorCode) {
    super(code);
    this.code = code;
    this.name = "JournalClientError";
  }
}
