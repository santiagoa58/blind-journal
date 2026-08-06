import { encrypt, generateEncryptionKey, wrapKey } from "@/crypto/encrypt.crypto";
import "client-only";
import type { JournalEntry } from "./journal.type";

function validateSize(data: Uint8Array) {
  const sizeInMB = data.byteLength / (1024 * 1024);
  if (sizeInMB > 5) {
    throw new Error("Document is too large. Maximum size is 5 MB.");
  }
}

export async function encryptJournalEntry(wrapperKey: CryptoKey, entry: JournalEntry) {
  const encryptKey = await generateEncryptionKey()
  const wrappedEncryptKey = await wrapKey(encryptKey, wrapperKey);

  const jsonContentStr = JSON.stringify(entry);
  const encoder = new TextEncoder();
  const rawBytes = encoder.encode(jsonContentStr);
  validateSize(rawBytes);
  const { cipherTextBase64, iv } = await encrypt(encryptKey, rawBytes);

  return {
    wrappedKey: wrappedEncryptKey,
    cipherTextBase64,
    iv,
  };
}
