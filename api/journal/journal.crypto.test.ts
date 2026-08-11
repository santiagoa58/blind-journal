import { describe, expect, it } from "vitest";
import {
  JOURNAL_ENTRY_ENCRYPTION_VERSION,
  MAX_JOURNAL_ENTRY_PLAINTEXT_BYTES,
  MAX_JOURNAL_ENTRY_PLAINTEXT_MEBIBYTES,
} from "@/api/journal/journal.constants";
import { decryptJournalEntry, encryptJournalEntry } from "@/api/journal/journal.crypto";
import { journalEntryContentSchema } from "@/api/journal/journal.schema";
import type {
  ApiCreateJournalEntryRequest,
  EncryptedJournalEntry,
  JournalEntryContent,
} from "@/api/journal/journal.type";
import { JOURNAL_CLIENT_ERROR_CODES } from "@/api/journal/journal-client.error";
import { base64ToUint8Array, uint8ArrayToBase64 } from "@/crypto/base64";
import { encrypt, generateEncryptionKey, wrapKey } from "@/crypto/encrypt.crypto";
import type { Base64 } from "@/types/base64";

const encoder = new TextEncoder();
const JOURNAL_ENTRY_CONTEXT = "blind-journal:entry";
const TEST_CONTENT = {
  title: "A test entry",
  content: "<p>Encrypted journal content.</p>",
  favorite: true,
  tags: ["private"],
} satisfies JournalEntryContent;

const COMPATIBILITY_USER_ID = "11111111-1111-4111-8111-111111111111";
const COMPATIBILITY_ENTRY = {
  id: "22222222-2222-4222-8222-222222222222",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  encryptedData: {
    version: JOURNAL_ENTRY_ENCRYPTION_VERSION,
    wrappedKeyBase64: "BPijw8MC07C36UsU3Pha0dppzXQFbteQfTy0n7J3maQQTbBY8pAa2w==",
    ciphertextBase64:
      "J3Apzj5Zjs6G24qpSwM/SHoSgAgDZd8xUmiwztTz6bQOvX1Tb3oqkchB2MS89XnFU2uBm3o2mebURHzdQNlDzCqp/3+YqZLlfBGoUXVbnfTxUu3btHhwIR+taG6ve48gIFV7tn5AOrzcBrv1M9JuUXEmY1d9+5gwth51",
    ivBase64: "AAECAwQFBgcICQoL",
  },
} satisfies EncryptedJournalEntry;

const COMPATIBILITY_CONTENT = {
  title: "Compatibility vector",
  content: "<p>Stable encrypted content.</p>",
  favorite: true,
  tags: ["v1"],
} satisfies JournalEntryContent;

async function createWrapperKey() {
  return crypto.subtle.generateKey({ name: "AES-KW", length: 256 }, false, [
    "wrapKey",
    "unwrapKey",
  ]);
}

function createStoredEntry(
  encrypted: ApiCreateJournalEntryRequest,
  timestamp = new Date().toISOString(),
): EncryptedJournalEntry {
  return {
    ...encrypted,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function getAdditionalData(userId: string, entryId: string) {
  return encoder.encode(
    `${JOURNAL_ENTRY_CONTEXT}:v${JOURNAL_ENTRY_ENCRYPTION_VERSION}:${userId}:${entryId}`,
  );
}

async function createAuthenticatedEntry(
  wrapperKey: CryptoKey,
  userId: string,
  entryId: string,
  plaintext: string,
): Promise<EncryptedJournalEntry> {
  const encryptionKey = await generateEncryptionKey();
  const { ciphertextBase64, iv } = await encrypt(
    encryptionKey,
    encoder.encode(plaintext),
    getAdditionalData(userId, entryId),
  );
  const wrappedKeyBase64 = await wrapKey(encryptionKey, wrapperKey);

  return createStoredEntry({
    id: entryId,
    encryptedData: {
      version: JOURNAL_ENTRY_ENCRYPTION_VERSION,
      wrappedKeyBase64,
      ciphertextBase64,
      ivBase64: uint8ArrayToBase64(iv),
    },
  });
}

function flipFirstByte(value: Base64): Base64 {
  const bytes = base64ToUint8Array(value);
  const firstByte = bytes[0];
  if (firstByte === undefined) {
    throw new Error("Cannot tamper with an empty test value");
  }
  bytes[0] = firstByte ^ 1;
  return uint8ArrayToBase64(bytes);
}

async function expectDecryptionFailure(result: Promise<unknown>) {
  await expect(result).rejects.toMatchObject({
    name: "JournalClientError",
    code: JOURNAL_CLIENT_ERROR_CODES.decryptionFailed,
  });
}

describe("journal encryption", () => {
  it("round-trips content without storing plaintext", async () => {
    const wrapperKey = await createWrapperKey();
    const userId = crypto.randomUUID();
    const entryId = crypto.randomUUID();
    const encrypted = await encryptJournalEntry(wrapperKey, userId, entryId, TEST_CONTENT);
    const storedEntry = createStoredEntry(encrypted);

    expect(JSON.stringify(storedEntry)).not.toContain(TEST_CONTENT.title);
    expect(JSON.stringify(storedEntry)).not.toContain(TEST_CONTENT.content);
    await expect(decryptJournalEntry(wrapperKey, userId, storedEntry)).resolves.toMatchObject({
      id: entryId,
      ...TEST_CONTENT,
    });
  });

  it("decrypts the stable v1 compatibility vector", async () => {
    const wrapperKey = await crypto.subtle.importKey(
      "raw",
      Uint8Array.from({ length: 32 }, (_, index) => index),
      "AES-KW",
      false,
      ["unwrapKey"],
    );

    await expect(
      decryptJournalEntry(wrapperKey, COMPATIBILITY_USER_ID, COMPATIBILITY_ENTRY),
    ).resolves.toEqual({
      id: COMPATIBILITY_ENTRY.id,
      createdAt: COMPATIBILITY_ENTRY.createdAt,
      updatedAt: COMPATIBILITY_ENTRY.updatedAt,
      ...COMPATIBILITY_CONTENT,
    });
  });

  it("rejects ciphertext moved to a different public entry identity", async () => {
    const wrapperKey = await createWrapperKey();
    const userId = crypto.randomUUID();
    const encrypted = await encryptJournalEntry(
      wrapperKey,
      userId,
      crypto.randomUUID(),
      TEST_CONTENT,
    );
    const movedEntry = {
      ...createStoredEntry(encrypted),
      id: crypto.randomUUID(),
    };

    await expectDecryptionFailure(decryptJournalEntry(wrapperKey, userId, movedEntry));
  });

  it("rejects an entry requested for a different user", async () => {
    const wrapperKey = await createWrapperKey();
    const userId = crypto.randomUUID();
    const encrypted = await encryptJournalEntry(
      wrapperKey,
      userId,
      crypto.randomUUID(),
      TEST_CONTENT,
    );

    await expectDecryptionFailure(
      decryptJournalEntry(wrapperKey, crypto.randomUUID(), createStoredEntry(encrypted)),
    );
  });

  it("rejects an entry decrypted with a different wrapping key", async () => {
    const wrapperKey = await createWrapperKey();
    const userId = crypto.randomUUID();
    const encrypted = await encryptJournalEntry(
      wrapperKey,
      userId,
      crypto.randomUUID(),
      TEST_CONTENT,
    );

    await expectDecryptionFailure(
      decryptJournalEntry(await createWrapperKey(), userId, createStoredEntry(encrypted)),
    );
  });

  it.each(["ivBase64", "ciphertextBase64", "wrappedKeyBase64"] as const)(
    "rejects a modified %s value",
    async (field) => {
      const wrapperKey = await createWrapperKey();
      const userId = crypto.randomUUID();
      const encrypted = await encryptJournalEntry(
        wrapperKey,
        userId,
        crypto.randomUUID(),
        TEST_CONTENT,
      );
      const storedEntry = createStoredEntry(encrypted);
      const tamperedEntry = {
        ...storedEntry,
        encryptedData: {
          ...storedEntry.encryptedData,
          [field]: flipFirstByte(storedEntry.encryptedData[field]),
        },
      };

      await expectDecryptionFailure(decryptJournalEntry(wrapperKey, userId, tamperedEntry));
    },
  );

  it("rejects an unsupported envelope version at the schema boundary", async () => {
    const wrapperKey = await createWrapperKey();
    const userId = crypto.randomUUID();
    const encrypted = await encryptJournalEntry(
      wrapperKey,
      userId,
      crypto.randomUUID(),
      TEST_CONTENT,
    );
    const unsupportedEntry = {
      ...createStoredEntry(encrypted),
      encryptedData: {
        ...encrypted.encryptedData,
        version: 2,
      },
    } as unknown as EncryptedJournalEntry;

    await expect(decryptJournalEntry(wrapperKey, userId, unsupportedEntry)).rejects.toMatchObject({
      code: JOURNAL_CLIENT_ERROR_CODES.decryptionFailed,
      cause: { name: "ZodError" },
    });
  });

  it.each(["ivBase64", "ciphertextBase64", "wrappedKeyBase64"] as const)(
    "rejects malformed base64 in %s at the schema boundary",
    async (field) => {
      const wrapperKey = await createWrapperKey();
      const userId = crypto.randomUUID();
      const encrypted = await encryptJournalEntry(
        wrapperKey,
        userId,
        crypto.randomUUID(),
        TEST_CONTENT,
      );
      const storedEntry = createStoredEntry(encrypted);
      const malformedEntry = {
        ...storedEntry,
        encryptedData: {
          ...storedEntry.encryptedData,
          [field]: "not base64!",
        },
      } as EncryptedJournalEntry;

      await expect(decryptJournalEntry(wrapperKey, userId, malformedEntry)).rejects.toMatchObject({
        code: JOURNAL_CLIENT_ERROR_CODES.decryptionFailed,
        cause: { name: "ZodError" },
      });
    },
  );

  it("rejects authenticated plaintext that is not JSON", async () => {
    const wrapperKey = await createWrapperKey();
    const userId = crypto.randomUUID();
    const entry = await createAuthenticatedEntry(wrapperKey, userId, crypto.randomUUID(), "{");

    await expect(decryptJournalEntry(wrapperKey, userId, entry)).rejects.toMatchObject({
      code: JOURNAL_CLIENT_ERROR_CODES.decryptionFailed,
      cause: { name: "SyntaxError" },
    });
  });

  it("rejects authenticated JSON that violates the journal content schema", async () => {
    const wrapperKey = await createWrapperKey();
    const userId = crypto.randomUUID();
    const entry = await createAuthenticatedEntry(
      wrapperKey,
      userId,
      crypto.randomUUID(),
      JSON.stringify({
        title: "Invalid content",
        content: 42,
        favorite: false,
        tags: [],
      }),
    );

    await expect(decryptJournalEntry(wrapperKey, userId, entry)).rejects.toMatchObject({
      code: JOURNAL_CLIENT_ERROR_CODES.decryptionFailed,
      cause: { name: "ZodError" },
    });
  });

  it("accepts plaintext at the exact size limit", async () => {
    const wrapperKey = await createWrapperKey();
    const contentWithoutBody = journalEntryContentSchema.parse({
      title: "T",
      content: "",
      favorite: false,
      tags: [],
    });
    const jsonOverhead = encoder.encode(JSON.stringify(contentWithoutBody)).byteLength;
    const content = {
      ...contentWithoutBody,
      content: "x".repeat(MAX_JOURNAL_ENTRY_PLAINTEXT_BYTES - jsonOverhead),
    };

    await expect(
      encryptJournalEntry(wrapperKey, crypto.randomUUID(), crypto.randomUUID(), content),
    ).resolves.toMatchObject({
      encryptedData: { version: JOURNAL_ENTRY_ENCRYPTION_VERSION },
    });
  });

  it("rejects plaintext one byte above the size limit", async () => {
    const wrapperKey = await createWrapperKey();
    const contentWithoutBody = journalEntryContentSchema.parse({
      title: "T",
      content: "",
      favorite: false,
      tags: [],
    });
    const jsonOverhead = encoder.encode(JSON.stringify(contentWithoutBody)).byteLength;
    const content = {
      ...contentWithoutBody,
      content: "x".repeat(MAX_JOURNAL_ENTRY_PLAINTEXT_BYTES - jsonOverhead + 1),
    };

    await expect(
      encryptJournalEntry(wrapperKey, crypto.randomUUID(), crypto.randomUUID(), content),
    ).rejects.toMatchObject({
      code: JOURNAL_CLIENT_ERROR_CODES.documentTooLarge,
      values: { maxSize: MAX_JOURNAL_ENTRY_PLAINTEXT_MEBIBYTES },
    });
  });
});
