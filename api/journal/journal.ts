import { api } from "@/api/client";
import type {
  CreateJournalEntryRequest,
  DeleteJournalEntryResponse,
  JournalEntriesResponse,
  JournalEntryResponse,
  UpdateJournalEntryRequest,
} from "@/api/journal/journal.type";

export function listJournalEntries(): Promise<JournalEntriesResponse> {
  return api.get("entries", { cache: "no-store" }).json<JournalEntriesResponse>();
}

export function createJournalEntry(
  input: CreateJournalEntryRequest,
): Promise<JournalEntryResponse> {
  return api.post("entries", { cache: "no-store", json: input }).json<JournalEntryResponse>();
}

export function updateJournalEntry(
  entryId: string,
  input: UpdateJournalEntryRequest,
): Promise<JournalEntryResponse> {
  return api
    .patch(`entries/${entryId}`, { cache: "no-store", json: input })
    .json<JournalEntryResponse>();
}

export function deleteJournalEntry(entryId: string): Promise<DeleteJournalEntryResponse> {
  return api.delete(`entries/${entryId}`, { cache: "no-store" }).json<DeleteJournalEntryResponse>();
}
