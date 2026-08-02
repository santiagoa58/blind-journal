import type { JournalEntriesResponse } from "@/api/journal/journal.type";
import { journalEntries } from "@/mocks/journal-entries.mock";

export function handleJournalEntriesRequest(): Response {
  const response = {
    success: true,
    data: journalEntries,
  } satisfies JournalEntriesResponse;

  return Response.json(response);
}
