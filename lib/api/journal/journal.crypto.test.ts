import { describe, expect, it, vi } from "vitest";
import { base64ToUint8Array, toBase64 } from "@/crypto/base64";
import {
  AES_GCM_AUTH_TAG_BYTES,
  AES_GCM_IV_BYTES,
  AES_KW_WRAPPED_KEY_BYTES,
} from "@/crypto/encrypt.constants";
import { encrypt, generateEncryptionKey, wrapKey } from "@/crypto/encrypt.crypto";
import {
  JOURNAL_ENTRY_ENCRYPTION_VERSION,
  MAX_JOURNAL_ENTRY_PLAINTEXT_BYTES,
  MAX_JOURNAL_ENTRY_PLAINTEXT_MEBIBYTES,
} from "@/lib/api/journal/journal.constants";
import { decryptJournalEntry, encryptJournalEntry } from "@/lib/api/journal/journal.crypto";
import {
  encryptedJournalDataSchema,
  encryptedJournalEntrySchema,
  journalEntryContentSchema,
} from "@/lib/api/journal/journal.schema";
import type {
  ApiCreateJournalEntryRequest,
  EncryptedJournalEntry,
  JournalEntryContent,
} from "@/lib/api/journal/journal.type";
import { JOURNAL_CLIENT_ERROR_CODES } from "@/lib/api/journal/journal-client.error";
import { MAX_FUNCTION_PAYLOAD_BYTES } from "@/lib/api/transport.constants";
import type { Base64 } from "@/types/base64";

const encoder = new TextEncoder();
const JOURNAL_ENTRY_CONTEXT = "blind-journal:entry";
const TEST_CONTENT = {
  title: "A test entry",
  content: "<p>Encrypted journal content.</p>",
} satisfies JournalEntryContent;

const V1_TEST_USER_ID = "11111111-1111-4111-8111-111111111111";
const V1_TEST_ENTRY = {
  id: "22222222-2222-4222-8222-222222222222",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  encryptedData: {
    version: JOURNAL_ENTRY_ENCRYPTION_VERSION,
    wrappedKeyBase64: "BPijw8MC07C36UsU3Pha0dppzXQFbteQfTy0n7J3maQQTbBY8pAa2w==",
    ciphertextBase64:
      "J3Apzj5Zjs6G24qpSwM/SHoSgAgDZd8xUmiwztTz6bQOvX1Tb3oqkchB2MS89XnFU2uBm3o2mebURHzdQNlDzCqp/3+YqZLlfBGoUSTGzXQH8rng6sPrRCl7JVjv",
    ivBase64: "AAECAwQFBgcICQoL",
  },
} satisfies EncryptedJournalEntry;

const V1_TEST_CONTENT = {
  title: "Compatibility vector",
  content: "<p>Stable encrypted content.</p>",
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
  plaintext: string | Uint8Array<ArrayBuffer>,
): Promise<EncryptedJournalEntry> {
  const encryptionKey = await generateEncryptionKey();
  const { ciphertextBase64, iv } = await encrypt(
    encryptionKey,
    typeof plaintext === "string" ? encoder.encode(plaintext) : plaintext,
    getAdditionalData(userId, entryId),
  );
  const wrappedKeyBase64 = await wrapKey(encryptionKey, wrapperKey);

  return createStoredEntry({
    id: entryId,
    encryptedData: {
      version: JOURNAL_ENTRY_ENCRYPTION_VERSION,
      wrappedKeyBase64,
      ciphertextBase64,
      ivBase64: toBase64(iv),
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
  return toBase64(bytes);
}

async function expectDecryptionFailure(result: Promise<unknown>) {
  await expect(result).rejects.toMatchObject({
    name: "JournalClientError",
    code: JOURNAL_CLIENT_ERROR_CODES.decryptionFailed,
  });
}

describe("journal encryption", () => {
  it.each([
    ["wrappedKeyBase64", AES_KW_WRAPPED_KEY_BYTES - 1],
    ["wrappedKeyBase64", AES_KW_WRAPPED_KEY_BYTES + 1],
    ["ivBase64", AES_GCM_IV_BYTES - 1],
    ["ivBase64", AES_GCM_IV_BYTES + 1],
    ["ciphertextBase64", AES_GCM_AUTH_TAG_BYTES - 1],
    ["ciphertextBase64", MAX_JOURNAL_ENTRY_PLAINTEXT_BYTES + AES_GCM_AUTH_TAG_BYTES + 1],
  ] as const)("rejects a %s envelope with %i decoded bytes", (field, byteLength) => {
    const envelope = {
      version: JOURNAL_ENTRY_ENCRYPTION_VERSION,
      wrappedKeyBase64: toBase64(new Uint8Array(AES_KW_WRAPPED_KEY_BYTES)),
      ciphertextBase64: toBase64(new Uint8Array(AES_GCM_AUTH_TAG_BYTES)),
      ivBase64: toBase64(new Uint8Array(AES_GCM_IV_BYTES)),
      [field]: toBase64(new Uint8Array(byteLength)),
    };

    expect(encryptedJournalDataSchema.safeParse(envelope).success).toBe(false);
  });

  it("rejects tag metadata outside the journal payload contract", () => {
    expect(
      journalEntryContentSchema.safeParse({
        ...TEST_CONTENT,
        tags: ["removed-feature"],
      }).success,
    ).toBe(false);
  });

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

  it("decrypts the known v1 test vector", async () => {
    const wrapperKey = await crypto.subtle.importKey(
      "raw",
      Uint8Array.from({ length: 32 }, (_, index) => index),
      "AES-KW",
      false,
      ["unwrapKey"],
    );

    await expect(decryptJournalEntry(wrapperKey, V1_TEST_USER_ID, V1_TEST_ENTRY)).resolves.toEqual({
      id: V1_TEST_ENTRY.id,
      createdAt: V1_TEST_ENTRY.createdAt,
      updatedAt: V1_TEST_ENTRY.updatedAt,
      ...V1_TEST_CONTENT,
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

    expect(encryptedJournalEntrySchema.safeParse(unsupportedEntry).success).toBe(false);
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

      expect(encryptedJournalEntrySchema.safeParse(malformedEntry).success).toBe(false);
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

  it("rejects authenticated JSON bytes that are not valid UTF-8", async () => {
    const wrapperKey = await createWrapperKey();
    const userId = crypto.randomUUID();
    const prefix = encoder.encode('{"title":"Invalid bytes","content":"');
    const suffix = encoder.encode('"}');
    const plaintext = new Uint8Array(prefix.byteLength + 1 + suffix.byteLength);
    plaintext.set(prefix);
    plaintext[prefix.byteLength] = 0xff;
    plaintext.set(suffix, prefix.byteLength + 1);
    const entry = await createAuthenticatedEntry(
      wrapperKey,
      userId,
      crypto.randomUUID(),
      plaintext,
    );

    await expect(decryptJournalEntry(wrapperKey, userId, entry)).rejects.toMatchObject({
      code: JOURNAL_CLIENT_ERROR_CODES.decryptionFailed,
      cause: { name: "TypeError" },
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

  it("keeps a serialized maximum-size encrypted request below the deployment limit", async () => {
    const wrapperKey = await createWrapperKey();
    const contentWithoutBody = journalEntryContentSchema.parse({
      title: "T",
      content: "",
    });
    const jsonOverhead = encoder.encode(JSON.stringify(contentWithoutBody)).byteLength;
    const request = await encryptJournalEntry(
      wrapperKey,
      "11111111-1111-4111-8111-111111111111",
      "22222222-2222-4222-8222-222222222222",
      {
        ...contentWithoutBody,
        content: "x".repeat(MAX_JOURNAL_ENTRY_PLAINTEXT_BYTES - jsonOverhead),
      },
    );
    const serializedRequestBytes = encoder.encode(JSON.stringify(request)).byteLength;

    expect(serializedRequestBytes).toBeLessThan(MAX_FUNCTION_PAYLOAD_BYTES);
  });

  it("rejects plaintext one byte above the size limit", async () => {
    const wrapperKey = await createWrapperKey();
    const contentWithoutBody = journalEntryContentSchema.parse({
      title: "T",
      content: "",
    });
    const jsonOverhead = encoder.encode(JSON.stringify(contentWithoutBody)).byteLength;
    const content = {
      ...contentWithoutBody,
      content: "x".repeat(MAX_JOURNAL_ENTRY_PLAINTEXT_BYTES - jsonOverhead + 1),
    };

    const generateKey = vi.spyOn(crypto.subtle, "generateKey");
    try {
      await expect(
        encryptJournalEntry(wrapperKey, crypto.randomUUID(), crypto.randomUUID(), content),
      ).rejects.toMatchObject({
        code: JOURNAL_CLIENT_ERROR_CODES.documentTooLarge,
        values: { maxSize: MAX_JOURNAL_ENTRY_PLAINTEXT_MEBIBYTES },
      });
      expect(generateKey).not.toHaveBeenCalled();
    } finally {
      generateKey.mockRestore();
    }
  });

  it("reports invalid content separately from cryptographic failures", async () => {
    const wrapperKey = await createWrapperKey();

    await expect(
      encryptJournalEntry(wrapperKey, crypto.randomUUID(), crypto.randomUUID(), {
        title: "x".repeat(121),
        content: "",
      }),
    ).rejects.toMatchObject({ code: JOURNAL_CLIENT_ERROR_CODES.invalidContent });
  });
});
