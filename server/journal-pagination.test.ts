import { afterEach, describe, expect, it, vi } from "vitest";
import { JOURNAL_ENTRIES_PAGE_SIZE } from "@/api/journal/journal.constants";
import type { EncryptedJournalEntry } from "@/api/journal/journal.type";
import { toBase64, valueToBase64Url } from "@/crypto/base64";
import { serverApplicationStore, serverStore } from "@/server/store";

vi.mock("server-only", () => ({}));

function encryptedEntry(index: number, updatedAt = "2026-01-01T00:00:00.000Z") {
  return {
    id: `00000000-0000-4000-8000-${index.toString().padStart(12, "0")}`,
    createdAt: updatedAt,
    updatedAt,
    encryptedData: {
      version: 1,
      wrappedKeyBase64: toBase64(new Uint8Array(40)),
      ciphertextBase64: toBase64(new Uint8Array(32)),
      ivBase64: toBase64(new Uint8Array(12)),
    },
  } satisfies EncryptedJournalEntry;
}

afterEach(() => {
  serverStore.entriesByUserId.clear();
});

describe("journal entry cursor pagination", () => {
  it("continues without duplicates when entries share the same timestamp", () => {
    const userId = "user-id";
    const entries = Array.from({ length: JOURNAL_ENTRIES_PAGE_SIZE + 3 }, (_, index) =>
      encryptedEntry(index),
    );
    serverStore.entriesByUserId.set(userId, entries);

    const firstPage = serverApplicationStore.getJournalEntriesPage(
      userId,
      undefined,
      JOURNAL_ENTRIES_PAGE_SIZE,
    );
    if (!firstPage?.nextCursor) {
      throw new Error("The first page did not include a cursor.");
    }
    const secondPage = serverApplicationStore.getJournalEntriesPage(
      userId,
      firstPage.nextCursor,
      JOURNAL_ENTRIES_PAGE_SIZE,
    );

    expect(firstPage.entries).toHaveLength(JOURNAL_ENTRIES_PAGE_SIZE);
    expect(secondPage?.entries).toHaveLength(3);
    expect(secondPage?.nextCursor).toBeNull();
    expect(
      new Set([...firstPage.entries, ...(secondPage?.entries ?? [])].map(({ id }) => id)).size,
    ).toBe(entries.length);
  });

  it("rejects a malformed or structurally invalid cursor", () => {
    serverStore.entriesByUserId.set("user-id", [encryptedEntry(1)]);

    expect(serverApplicationStore.getJournalEntriesPage("user-id", "not-json", 20)).toBeUndefined();
    expect(
      serverApplicationStore.getJournalEntriesPage("user-id", valueToBase64Url({ id: 1 }), 20),
    ).toBeUndefined();
    expect(
      serverApplicationStore.getJournalEntriesPage(
        "user-id",
        valueToBase64Url({
          id: "00000000-0000-4000-8000-000000000001",
          updatedAt: "not-a-timestamp",
        }),
        20,
      ),
    ).toBeUndefined();
  });
});
