import {
  JOURNAL_ENTRY_ENCRYPTION_VERSION,
  MAX_JOURNAL_ENTRY_PLAINTEXT_BYTES,
} from "@/api/journal/journal.constants";
import { JOURNAL_CLIENT_ERROR_CODES, JournalClientError } from "@/api/journal/journal.error";
import {
  encryptedJournalEntrySchema,
  journalEntryContentSchema,
} from "@/api/journal/journal.schema";
import { base64ToUint8Array, uint8ArrayToBase64 } from "@/crypto/base64";
import {
  decrypt,
  encrypt,
  generateEncryptionKey,
  unwrapKey,
  wrapKey,
} from "@/crypto/encrypt.crypto";
import type {
  ApiCreateJournalEntryRequest,
  EncryptedJournalData,
  EncryptedJournalEntry,
  JournalEntry,
  JournalEntryContent,
} from "./journal.type";

type JournalEntryEncryptionVersion = EncryptedJournalData["version"];

const JOURNAL_ENTRY_CONTEXT = "blind-journal:entry";
function validatePlaintextSize(data: Uint8Array) {
  if (data.byteLength > MAX_JOURNAL_ENTRY_PLAINTEXT_BYTES) {
    throw new JournalClientError(JOURNAL_CLIENT_ERROR_CODES.documentTooLarge);
  }
}

function getAdditionalData(
  version: JournalEntryEncryptionVersion,
  userId: string,
  entryId: string,
): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(`${JOURNAL_ENTRY_CONTEXT}:v${version}:${userId}:${entryId}`);
}

export async function encryptJournalEntry(
  wrapperKey: CryptoKey,
  userId: string,
  entryId: string,
  entry: JournalEntryContent,
): Promise<ApiCreateJournalEntryRequest> {
  const version = JOURNAL_ENTRY_ENCRYPTION_VERSION;
  const content = journalEntryContentSchema.parse(entry);
  const encryptKey = await generateEncryptionKey();
  const wrappedEncryptKeyBase64 = await wrapKey(encryptKey, wrapperKey);

  const jsonContentStr = JSON.stringify(content);
  const encoder = new TextEncoder();
  const rawBytes = encoder.encode(jsonContentStr);
  validatePlaintextSize(rawBytes);
  const { ciphertextBase64, iv } = await encrypt(
    encryptKey,
    rawBytes,
    getAdditionalData(version, userId, entryId),
  );

  return {
    id: entryId,
    encryptedData: {
      version,
      wrappedKeyBase64: wrappedEncryptKeyBase64,
      ciphertextBase64,
      ivBase64: uint8ArrayToBase64(iv),
    },
  };
}

export async function decryptJournalEntry(
  wrapperKey: CryptoKey,
  userId: string,
  entry: EncryptedJournalEntry,
): Promise<JournalEntry> {
  const encryptedEntry = encryptedJournalEntrySchema.parse(entry);
  const { version, ciphertextBase64, ivBase64, wrappedKeyBase64 } = encryptedEntry.encryptedData;
  const encryptionKey = await unwrapKey(base64ToUint8Array(wrappedKeyBase64), wrapperKey);
  const plaintext = await decrypt(
    encryptionKey,
    base64ToUint8Array(ciphertextBase64),
    base64ToUint8Array(ivBase64),
    getAdditionalData(version, userId, encryptedEntry.id),
  );
  const parsedJson: unknown = JSON.parse(new TextDecoder().decode(plaintext));
  const content = journalEntryContentSchema.parse(parsedJson);

  return {
    id: encryptedEntry.id,
    createdAt: encryptedEntry.createdAt,
    updatedAt: encryptedEntry.updatedAt,
    ...content,
  };
}
