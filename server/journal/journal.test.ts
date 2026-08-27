import { afterEach, describe, expect, it, vi } from "vitest";
import { JOURNAL_ERROR_CODES } from "@/api/journal/journal.error";
import type {
  ApiCreateJournalEntryRequest,
  EncryptedJournalEntry,
} from "@/api/journal/journal.type";
import { toBase64 } from "@/crypto/base64";
import { createEntry, deleteEntry, listEntries, updateEntry } from "@/server/journal/journal";

const journalDatabaseMocks = vi.hoisted(() => ({
  deleteJournalEntry: vi.fn(),
  getJournalEntriesPage: vi.fn(),
  insertJournalEntry: vi.fn(),
  replaceJournalEntry: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/server/database/journal-entries", () => journalDatabaseMocks);

function encryptedData(marker: number) {
  return {
    version: 1,
    wrappedKeyBase64: toBase64(new Uint8Array(40).fill(marker)),
    ciphertextBase64: toBase64(new Uint8Array(32).fill(marker)),
    ivBase64: toBase64(new Uint8Array(12).fill(marker)),
  } as const;
}

function createRequest(id = crypto.randomUUID(), marker = 1): ApiCreateJournalEntryRequest {
  return { id, encryptedData: encryptedData(marker) };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("journal domain", () => {
  it("rejects a cursor that persistence cannot decode", async () => {
    journalDatabaseMocks.getJournalEntriesPage.mockResolvedValue(undefined);

    await expect(listEntries("user-id", { cursor: "not-json" })).resolves.toEqual({
      success: false,
      error: { code: JOURNAL_ERROR_CODES.invalidEntry },
    });
    expect(journalDatabaseMocks.getJournalEntriesPage).toHaveBeenCalledWith(
      "user-id",
      "not-json",
      20,
    );
  });

  it("returns a bounded page from persistence", async () => {
    const entry = {
      ...createRequest(),
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    } satisfies EncryptedJournalEntry;
    journalDatabaseMocks.getJournalEntriesPage.mockResolvedValue({
      entries: [entry],
      nextCursor: null,
    });

    await expect(listEntries("user-id", {})).resolves.toEqual({
      success: true,
      data: { records: [entry], nextCursor: null },
    });
  });

  it.each([
    ["entry-already-exists", JOURNAL_ERROR_CODES.entryAlreadyExists],
    ["quota-exceeded", JOURNAL_ERROR_CODES.storageQuotaExceeded],
  ] as const)("maps create result %s to a stable domain error", async (writeResult, errorCode) => {
    journalDatabaseMocks.insertJournalEntry.mockResolvedValue(writeResult);

    await expect(createEntry("user-id", createRequest())).resolves.toEqual({
      success: false,
      error: { code: errorCode },
    });
  });

  it("returns the server-authored timestamps for a created entry", async () => {
    const request = createRequest();
    journalDatabaseMocks.insertJournalEntry.mockResolvedValue("created");

    const result = await createEntry("user-id", request);

    expect(result).toMatchObject({
      success: true,
      data: { id: request.id, encryptedData: request.encryptedData },
    });
    expect(journalDatabaseMocks.insertJournalEntry).toHaveBeenCalledWith(
      "user-id",
      expect.objectContaining({
        id: request.id,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }),
    );
  });

  it.each([
    ["entry-not-found", JOURNAL_ERROR_CODES.entryNotFound],
    ["quota-exceeded", JOURNAL_ERROR_CODES.storageQuotaExceeded],
  ] as const)("maps update result %s to a stable domain error", async (status, errorCode) => {
    journalDatabaseMocks.replaceJournalEntry.mockResolvedValue({ status });

    await expect(
      updateEntry("user-id", crypto.randomUUID(), { encryptedData: encryptedData(2) }),
    ).resolves.toEqual({ success: false, error: { code: errorCode } });
  });

  it("keeps delete behavior owner-scoped through the database operation", async () => {
    const entryId = crypto.randomUUID();
    journalDatabaseMocks.deleteJournalEntry.mockResolvedValue(false);

    await expect(deleteEntry("user-id", entryId)).resolves.toEqual({
      success: false,
      error: { code: JOURNAL_ERROR_CODES.entryNotFound },
    });
    expect(journalDatabaseMocks.deleteJournalEntry).toHaveBeenCalledWith("user-id", entryId);
  });

  it("does not swallow unexpected persistence failures", async () => {
    const failure = new Error("The journal database is unavailable.");
    journalDatabaseMocks.insertJournalEntry.mockRejectedValue(failure);

    await expect(createEntry("user-id", createRequest())).rejects.toThrow(failure);
  });
});
