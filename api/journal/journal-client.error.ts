import { ClientError, type ClientErrorOptions } from "@/client.error";

export const JOURNAL_CLIENT_ERROR_CODES = {
  documentTooLarge: "JOURNAL_CLIENT_DOCUMENT_TOO_LARGE",
  encryptionFailed: "JOURNAL_CLIENT_ENCRYPTION_FAILED",
  decryptionFailed: "JOURNAL_CLIENT_DECRYPTION_FAILED",
  encryptionKeyUnavailable: "JOURNAL_CLIENT_ENCRYPTION_KEY_UNAVAILABLE",
} as const;

export type JournalClientErrorCode =
  (typeof JOURNAL_CLIENT_ERROR_CODES)[keyof typeof JOURNAL_CLIENT_ERROR_CODES];

export class JournalClientError extends ClientError<JournalClientErrorCode> {
  constructor(code: JournalClientErrorCode, options?: ClientErrorOptions) {
    super(code, options);
    this.name = "JournalClientError";
  }
}
