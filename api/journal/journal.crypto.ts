import {
  JOURNAL_ENTRY_ENCRYPTION_VERSION,
  MAX_JOURNAL_ENTRY_PLAINTEXT_BYTES,
  MAX_JOURNAL_ENTRY_PLAINTEXT_MEBIBYTES,
} from "@/api/journal/journal.constants";
import { journalEntryContentSchema } from "@/api/journal/journal.schema";
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
  const parsedContent = journalEntryContentSchema.safeParse(entry);
  if (!parsedContent.success) {
    throw new JournalClientError(JOURNAL_CLIENT_ERROR_CODES.invalidContent, {
      cause: parsedContent.error,
    });
  }

  try {
    const version = JOURNAL_ENTRY_ENCRYPTION_VERSION;
    const plaintext = new TextEncoder().encode(JSON.stringify(parsedContent.data));
    try {
      validatePlaintextSize(plaintext);
      const encryptionKey = await generateEncryptionKey();
      const wrappedKeyBase64 = await wrapKey(encryptionKey, wrapperKey);
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
    } finally {
      plaintext.fill(0);
    }
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
    const { version, ciphertextBase64, ivBase64, wrappedKeyBase64 } = entry.encryptedData;
    const encryptionKey = await unwrapKey(base64ToUint8Array(wrappedKeyBase64), wrapperKey);
    const plaintext = await decrypt(
      encryptionKey,
      base64ToUint8Array(ciphertextBase64),
      base64ToUint8Array(ivBase64),
      getAdditionalData(version, userId, entry.id),
    );
    try {
      const parsedJson: unknown = JSON.parse(
        new TextDecoder("utf-8", { fatal: true }).decode(plaintext),
      );
      const content = journalEntryContentSchema.parse(parsedJson);

      return {
        id: entry.id,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        ...content,
      };
    } finally {
      new Uint8Array(plaintext).fill(0);
    }
  } catch (error) {
    throw new JournalClientError(JOURNAL_CLIENT_ERROR_CODES.decryptionFailed, { cause: error });
  }
}
