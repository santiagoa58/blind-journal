import { constants as HTTP_STATUS } from "node:http2";
import { JOURNAL_ERROR_CODES, type JournalErrorCode } from "@/api/journal/journal.error";

const journalErrorHttpStatus = {
  [JOURNAL_ERROR_CODES.invalidEntry]: HTTP_STATUS.HTTP_STATUS_UNPROCESSABLE_ENTITY,
  [JOURNAL_ERROR_CODES.entryAlreadyExists]: HTTP_STATUS.HTTP_STATUS_CONFLICT,
  [JOURNAL_ERROR_CODES.entryNotFound]: HTTP_STATUS.HTTP_STATUS_NOT_FOUND,
} satisfies Record<JournalErrorCode, number>;

export function getJournalErrorHttpStatus(code: JournalErrorCode): number {
  return journalErrorHttpStatus[code];
}
