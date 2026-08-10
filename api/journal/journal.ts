import type { ClientUser } from "@/api/auth/user.type";
import { api } from "@/api/http";
import { decryptJournalEntry, encryptJournalEntry } from "@/api/journal/journal.crypto";
import type {
  ApiCreateJournalEntryRequest,
  ApiDeleteJournalEntryResponse,
  ApiUpdateJournalEntryRequest,
  ClientCreateJournalEntryRequest,
  ClientUpdateJournalEntryRequest,
  EncryptedJournalEntry,
} from "@/api/journal/journal.type";
import { JOURNAL_CLIENT_ERROR_CODES, JournalClientError } from "@/api/journal/journal-client.error";

function listEncryptedJournalEntries() {
  return api.get("entries", { cache: "no-store" }).json<EncryptedJournalEntry[]>();
}

function createEncryptedJournalEntry(input: ApiCreateJournalEntryRequest) {
  return api.post("entries", { cache: "no-store", json: input }).json<EncryptedJournalEntry>();
}

function updateEncryptedJournalEntry(entryId: string, input: ApiUpdateJournalEntryRequest) {
  return api
    .patch(`entries/${entryId}`, { cache: "no-store", json: input })
    .json<EncryptedJournalEntry>();
}

export function deleteJournalEntry(entryId: string) {
  return api
    .delete(`entries/${entryId}`, { cache: "no-store" })
    .json<ApiDeleteJournalEntryResponse>();
}

export async function listJournalEntries(user: ClientUser | null) {
  if (!user) {
    throw new JournalClientError(JOURNAL_CLIENT_ERROR_CODES.encryptionKeyUnavailable);
  }

  // TODO(encryption-protocol): Decrypt entry keys with the in-memory vault key once account unlock
  // provisions it. The current keyEncryptionKey is derived directly from the password.
  const entries = await listEncryptedJournalEntries();
  return Promise.all(
    entries.map((entry) => decryptJournalEntry(user.keyEncryptionKey, user.id, entry)),
  );
}

export async function createJournalEntry(
  input: ClientCreateJournalEntryRequest,
  user: ClientUser | null,
) {
  if (!user) {
    throw new JournalClientError(JOURNAL_CLIENT_ERROR_CODES.encryptionKeyUnavailable);
  }

  const id = crypto.randomUUID();
  const encryptedInput = await encryptJournalEntry(user.keyEncryptionKey, user.id, id, {
    ...input,
    favorite: false,
    tags: [],
  });
  const response = await createEncryptedJournalEntry(encryptedInput);
  return decryptJournalEntry(user.keyEncryptionKey, user.id, response);
}

export async function updateJournalEntry(
  input: ClientUpdateJournalEntryRequest,
  user: ClientUser | null,
) {
  if (!user) {
    throw new JournalClientError(JOURNAL_CLIENT_ERROR_CODES.encryptionKeyUnavailable);
  }

  const { id, ...content } = input;
  const encryptedInput = await encryptJournalEntry(user.keyEncryptionKey, user.id, id, content);
  const response = await updateEncryptedJournalEntry(id, {
    encryptedData: encryptedInput.encryptedData,
  });
  return decryptJournalEntry(user.keyEncryptionKey, user.id, response);
}
