import { describe, expect, it } from "vitest";
import type { EncryptedJournalEntry } from "@/api/journal/journal.type";
import { valueToBase64Url } from "@/crypto/base64";
import {
  decodeJournalEntriesCursor,
  encodeJournalEntriesCursor,
} from "@/server/journal/pagination";

const entry = {
  id: "00000000-0000-4000-8000-000000000001",
  updatedAt: "2026-01-01T00:00:00.000Z",
} as EncryptedJournalEntry;

describe("journal entry cursors", () => {
  it("round-trips the entry ordering fields", () => {
    expect(decodeJournalEntriesCursor(encodeJournalEntriesCursor(entry))).toEqual({
      id: entry.id,
      updatedAt: entry.updatedAt,
    });
  });

  it("rejects malformed or structurally invalid cursors", () => {
    expect(decodeJournalEntriesCursor("not-json")).toBeUndefined();
    expect(decodeJournalEntriesCursor(valueToBase64Url({ id: 1 }))).toBeUndefined();
    expect(
      decodeJournalEntriesCursor(valueToBase64Url({ id: entry.id, updatedAt: "not-a-timestamp" })),
    ).toBeUndefined();
  });
});
