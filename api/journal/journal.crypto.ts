import {
  JOURNAL_ENTRY_ENCRYPTION_VERSION,
  MAX_JOURNAL_ENTRY_PLAINTEXT_BYTES,
  MAX_JOURNAL_ENTRY_PLAINTEXT_MEBIBYTES,
} from "@/api/journal/journal.constants";
import {
  encryptedJournalEntrySchema,
  journalEntryContentSchema,
} from "@/api/journal/journal.schema";
import type {
  ApiCreateJournalEntryRequest,
  EncryptedJournalData,
  EncryptedJournalEntry,
  JournalEntry,
  JournalEntryContent,
} from "@/api/journal/journal.type";
import { JOURNAL_CLIENT_ERROR_CODES, JournalClientError } from "@/api/journal/journal-client.error";
import { base64ToUint8Array, toBase64 } from "@/crypto/base64";
import {
  decrypt,
  encrypt,
  generateEncryptionKey,
  unwrapKey,
  wrapKey,
} from "@/crypto/encrypt.crypto";

type JournalEntryEncryptionVersion = EncryptedJournalData["version"];

const JOURNAL_ENTRY_CONTEXT = "blind-journal:entry";

function validatePlaintextSize(data: Uint8Array) {
  if (data.byteLength > MAX_JOURNAL_ENTRY_PLAINTEXT_BYTES) {
    throw new JournalClientError(JOURNAL_CLIENT_ERROR_CODES.documentTooLarge, {
      values: { maxSize: MAX_JOURNAL_ENTRY_PLAINTEXT_MEBIBYTES },
    });
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
  try {
    const version = JOURNAL_ENTRY_ENCRYPTION_VERSION;
    const content = journalEntryContentSchema.parse(entry);
    const encryptionKey = await generateEncryptionKey();
    const wrappedKeyBase64 = await wrapKey(encryptionKey, wrapperKey);
    const plaintext = new TextEncoder().encode(JSON.stringify(content));
    validatePlaintextSize(plaintext);
    const { ciphertextBase64, iv } = await encrypt(
      encryptionKey,
      plaintext,
      getAdditionalData(version, userId, entryId),
    );

    return {
      id: entryId,
      encryptedData: {
        version,
        wrappedKeyBase64,
        ciphertextBase64,
        ivBase64: toBase64(iv),
      },
    };
  } catch (error) {
    if (error instanceof JournalClientError) {
      throw error;
    }

    throw new JournalClientError(JOURNAL_CLIENT_ERROR_CODES.encryptionFailed, { cause: error });
  }
}

export async function decryptJournalEntry(
  wrapperKey: CryptoKey,
  userId: string,
  entry: EncryptedJournalEntry,
): Promise<JournalEntry> {
  try {
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
  } catch (error) {
    throw new JournalClientError(JOURNAL_CLIENT_ERROR_CODES.decryptionFailed, { cause: error });
  }
}
