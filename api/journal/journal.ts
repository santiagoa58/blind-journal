import { api } from "@/api/client";
import type {
  ApiDeleteJournalEntryResponse,
  ApiJournalEntriesResponse,
  ApiJournalEntryResponse,
  ClientCreateJournalEntryRequest,
  ClientUpdateJournalEntryRequest,
} from "@/api/journal/journal.type";
import type { ClientUser } from "../auth/user.type";
import { encryptJournalEntry } from "./journal.crypto";

export function listJournalEntries(): Promise<ApiJournalEntriesResponse> {
  return api.get("entries", { cache: "no-store" }).json<ApiJournalEntriesResponse>();
}

export async function createJournalEntry(
  input: ClientCreateJournalEntryRequest,
  user: ClientUser,
): Promise<ApiJournalEntryResponse> {
  const encryptedInput = await encryptJournalEntry(user.masterKey, input);
  return api
    .post("entries", { cache: "no-store", json: encryptedInput })
    .json<ApiJournalEntryResponse>();
}

export async function updateJournalEntry(
  input: ClientUpdateJournalEntryRequest,
  user: ClientUser,
): Promise<ApiJournalEntryResponse> {
  const { id, ...updates } = input;
  const encryptedInput = await encryptJournalEntry(user.masterKey, updates);
  return api
    .patch(`entries/${id}`, { cache: "no-store", json: encryptedInput })
    .json<ApiJournalEntryResponse>();
}

export function deleteJournalEntry(entryId: string): Promise<ApiDeleteJournalEntryResponse> {
  return api
    .delete(`entries/${entryId}`, { cache: "no-store" })
    .json<ApiDeleteJournalEntryResponse>();
}
