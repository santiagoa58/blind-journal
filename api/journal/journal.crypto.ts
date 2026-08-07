import { uint8ArrayToBase64 } from "@/crypto/base64";
import { encrypt, generateEncryptionKey, wrapKey } from "@/crypto/encrypt.crypto";
import "client-only";
import type {
  ApiCreateJournalEntryRequest,
  ClientCreateJournalEntryRequest,
  ClientUpdateJournalEntryRequest,
} from "./journal.type";

type JournalEntryInput =
  | ClientCreateJournalEntryRequest
  | Omit<ClientUpdateJournalEntryRequest, "id">;

function validateSize(data: Uint8Array) {
  const sizeInMB = data.byteLength / (1024 * 1024);
  if (sizeInMB > 5) {
    throw new Error("Document is too large. Maximum size is 5 MB.");
  }
}

export async function encryptJournalEntry(
  wrapperKey: CryptoKey,
  entry: JournalEntryInput,
): Promise<ApiCreateJournalEntryRequest> {
  const encryptKey = await generateEncryptionKey();
  const wrappedEncryptKeyBase64 = await wrapKey(encryptKey, wrapperKey);

  const jsonContentStr = JSON.stringify(entry);
  const encoder = new TextEncoder();
  const rawBytes = encoder.encode(jsonContentStr);
  validateSize(rawBytes);
  const { cipherTextBase64, iv } = await encrypt(encryptKey, rawBytes);

  return {
    wrappedKeyBase64: wrappedEncryptKeyBase64,
    cipherTextBase64,
    ivBase64: uint8ArrayToBase64(iv),
  };
}
