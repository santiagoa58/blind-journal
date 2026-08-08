import { api } from "@/api/client";
import type {
  ApiDeleteJournalEntryResponse,
  ApiJournalEntriesResponse,
  ApiJournalEntryResponse,
  ClientCreateJournalEntryRequest,
  ClientJournalEntriesResponse,
  ClientJournalEntryResponse,
  ClientUpdateJournalEntryRequest,
} from "@/api/journal/journal.type";
import type { ClientUser } from "../auth/user.type";
import { decryptJournalEntry, encryptJournalEntry } from "./journal.crypto";

export async function listJournalEntries(user: ClientUser): Promise<ClientJournalEntriesResponse> {
  const response = await api
    .get("entries", { cache: "no-store" })
    .json<ApiJournalEntriesResponse>();

  if (!response.success) {
    return response;
  }

  return {
    success: true,
    data: await Promise.all(
      response.data.map((entry) => decryptJournalEntry(user.keyEncryptionKey, user.id, entry)),
    ),
  };
}

export async function createJournalEntry(
  input: ClientCreateJournalEntryRequest,
  user: ClientUser,
): Promise<ClientJournalEntryResponse> {
  const id = crypto.randomUUID();
  const encryptedInput = await encryptJournalEntry(user.keyEncryptionKey, user.id, id, {
    ...input,
    favorite: false,
    tags: [],
  });
  const response = await api
    .post("entries", { cache: "no-store", json: encryptedInput })
    .json<ApiJournalEntryResponse>();

  return response.success
    ? {
        success: true,
        data: await decryptJournalEntry(user.keyEncryptionKey, user.id, response.data),
      }
    : response;
}

export async function updateJournalEntry(
  input: ClientUpdateJournalEntryRequest,
  user: ClientUser,
): Promise<ClientJournalEntryResponse> {
  const { id, ...content } = input;
  const encryptedInput = await encryptJournalEntry(user.keyEncryptionKey, user.id, id, content);
  const response = await api
    .patch(`entries/${id}`, {
      cache: "no-store",
      json: { encryptedData: encryptedInput.encryptedData },
    })
    .json<ApiJournalEntryResponse>();

  return response.success
    ? {
        success: true,
        data: await decryptJournalEntry(user.keyEncryptionKey, user.id, response.data),
      }
    : response;
}

export function deleteJournalEntry(entryId: string): Promise<ApiDeleteJournalEntryResponse> {
  return api
    .delete(`entries/${entryId}`, { cache: "no-store" })
    .json<ApiDeleteJournalEntryResponse>();
}
