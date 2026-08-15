import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClientUser } from "@/api/auth/user.type";
import { listJournalEntriesPage } from "@/api/journal/journal";
import { MAX_CONCURRENT_JOURNAL_ENTRY_DECRYPTIONS } from "@/api/journal/journal.constants";
import type { EncryptedJournalEntry, JournalEntry } from "@/api/journal/journal.type";
import { toBase64 } from "@/crypto/base64";

const mocks = vi.hoisted(() => ({
  decryptJournalEntry: vi.fn(),
  get: vi.fn(),
  json: vi.fn(),
}));

vi.mock("@/api/http", () => ({
  api: { get: mocks.get },
}));

vi.mock("@/api/journal/journal.crypto", () => ({
  decryptJournalEntry: mocks.decryptJournalEntry,
  encryptJournalEntry: vi.fn(),
}));

function encryptedEntry(index: number): EncryptedJournalEntry {
  const id = `00000000-0000-4000-8000-${index.toString().padStart(12, "0")}`;
  return {
    id,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    encryptedData: {
      version: 1,
      wrappedKeyBase64: toBase64(new Uint8Array(40)),
      ciphertextBase64: toBase64(new Uint8Array(32)),
      ivBase64: toBase64(new Uint8Array(12)),
    },
  };
}

beforeEach(() => {
  mocks.get.mockReturnValue({ json: mocks.json });
});

describe("journal page decryption concurrency", () => {
  it("never decrypts more than the configured number of entries at once", async () => {
    const records = Array.from(
      { length: MAX_CONCURRENT_JOURNAL_ENTRY_DECRYPTIONS * 2 + 1 },
      (_, index) => encryptedEntry(index),
    );
    mocks.json.mockResolvedValue({ records, nextCursor: null });
    let activeDecryptions = 0;
    let maximumActiveDecryptions = 0;
    const releases: Array<() => void> = [];
    mocks.decryptJournalEntry.mockImplementation(
      async (_key: CryptoKey, _userId: string, entry: EncryptedJournalEntry) => {
        activeDecryptions += 1;
        maximumActiveDecryptions = Math.max(maximumActiveDecryptions, activeDecryptions);
        await new Promise<void>((resolve) => releases.push(resolve));
        activeDecryptions -= 1;
        return {
          id: entry.id,
          title: entry.id,
          content: "",
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
        } satisfies JournalEntry;
      },
    );
    const request = listJournalEntriesPage(
      { id: "user-id", keyEncryptionKey: {} } as ClientUser,
      null,
    );

    await vi.waitFor(() =>
      expect(activeDecryptions).toBe(MAX_CONCURRENT_JOURNAL_ENTRY_DECRYPTIONS),
    );
    while (releases.length > 0) {
      for (const release of releases.splice(0)) {
        release();
      }
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    const result = await request;
    expect(result.entries).toHaveLength(records.length);
    expect(maximumActiveDecryptions).toBe(MAX_CONCURRENT_JOURNAL_ENTRY_DECRYPTIONS);
  });
});
