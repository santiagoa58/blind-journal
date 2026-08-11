import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClientUser } from "@/api/auth/user.type";
import { listJournalEntries } from "@/api/journal/journal";
import {
  JOURNAL_ENTRY_ENCRYPTION_VERSION,
  JOURNAL_ENTRY_UNREADABLE_REASONS,
} from "@/api/journal/journal.constants";
import { encryptJournalEntry } from "@/api/journal/journal.crypto";
import type { EncryptedJournalEntry, JournalEntryContent } from "@/api/journal/journal.type";
import { base64ToUint8Array, uint8ArrayToBase64 } from "@/crypto/base64";

const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  json: vi.fn(),
}));

vi.mock("@/api/http", () => ({
  api: {
    get: apiMocks.get,
  },
}));

const FIRST_CONTENT = {
  title: "First readable entry",
  content: "<p>First</p>",
  favorite: false,
  tags: [],
} satisfies JournalEntryContent;

const SECOND_CONTENT = {
  title: "Second readable entry",
  content: "<p>Second</p>",
  favorite: true,
  tags: ["readable"],
} satisfies JournalEntryContent;

async function createUser(): Promise<ClientUser> {
  return {
    id: crypto.randomUUID(),
    username: "journal-user",
    displayName: "Journal User",
    keyEncryptionKey: await crypto.subtle.generateKey({ name: "AES-KW", length: 256 }, false, [
      "wrapKey",
      "unwrapKey",
    ]),
  };
}

async function createEncryptedEntry(
  user: ClientUser,
  content: JournalEntryContent,
): Promise<EncryptedJournalEntry> {
  const encrypted = await encryptJournalEntry(
    user.keyEncryptionKey,
    user.id,
    crypto.randomUUID(),
    content,
  );
  const timestamp = "2026-01-01T00:00:00.000Z";

  return {
    ...encrypted,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function corruptCiphertext(entry: EncryptedJournalEntry): EncryptedJournalEntry {
  const ciphertext = base64ToUint8Array(entry.encryptedData.ciphertextBase64);
  const firstByte = ciphertext[0];
  if (firstByte === undefined) {
    throw new Error("The encrypted test fixture has no ciphertext");
  }
  ciphertext[0] = firstByte ^ 1;

  return {
    ...entry,
    encryptedData: {
      ...entry.encryptedData,
      ciphertextBase64: uint8ArrayToBase64(ciphertext),
    },
  };
}

beforeEach(() => {
  apiMocks.get.mockReturnValue({ json: apiMocks.json });
});

describe("listJournalEntries", () => {
  it("keeps healthy entries available while preserving corrupt and invalid records", async () => {
    const user = await createUser();
    const firstEntry = await createEncryptedEntry(user, FIRST_CONTENT);
    const corruptEntry = corruptCiphertext(await createEncryptedEntry(user, FIRST_CONTENT));
    const supportedEntry = await createEncryptedEntry(user, FIRST_CONTENT);
    const unsupportedEntry = {
      ...supportedEntry,
      encryptedData: {
        ...supportedEntry.encryptedData,
        version: JOURNAL_ENTRY_ENCRYPTION_VERSION + 1,
      },
    };
    const malformedEntry = { id: "not-a-valid-entry" };
    const secondEntry = await createEncryptedEntry(user, SECOND_CONTENT);
    apiMocks.json.mockResolvedValue([
      firstEntry,
      corruptEntry,
      unsupportedEntry,
      malformedEntry,
      secondEntry,
    ]);

    const result = await listJournalEntries(user);

    expect(result.entries.map(({ title }) => title)).toEqual([
      FIRST_CONTENT.title,
      SECOND_CONTENT.title,
    ]);
    expect(result.unreadableEntries).toEqual([
      {
        reason: JOURNAL_ENTRY_UNREADABLE_REASONS.decryptionFailed,
        record: corruptEntry,
      },
      {
        reason: JOURNAL_ENTRY_UNREADABLE_REASONS.invalidEnvelope,
        record: unsupportedEntry,
      },
      {
        reason: JOURNAL_ENTRY_UNREADABLE_REASONS.invalidEnvelope,
        record: malformedEntry,
      },
    ]);
  });

  it("still rejects a response that is not an entry collection", async () => {
    const user = await createUser();
    apiMocks.json.mockResolvedValue({ entries: [] });

    await expect(listJournalEntries(user)).rejects.toMatchObject({ name: "ZodError" });
  });
});
