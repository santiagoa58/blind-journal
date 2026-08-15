import { z } from "zod";
import { journalEntryIdSchema } from "@/api/journal/journal.schema";
import type { EncryptedJournalEntry } from "@/api/journal/journal.type";
import { base64ToValue, valueToBase64Url } from "@/crypto/base64";
import type { Base64Url } from "@/types/base64";

type JournalEntriesCursorData = Pick<EncryptedJournalEntry, "id" | "updatedAt">;
const journalEntriesCursorDataSchema: z.ZodType<JournalEntriesCursorData> = z.strictObject({
  id: journalEntryIdSchema,
  updatedAt: z.iso.datetime(),
});

export function compareJournalEntries(
  left: EncryptedJournalEntry,
  right: EncryptedJournalEntry,
): number {
  const updatedAtComparison = right.updatedAt.localeCompare(left.updatedAt);
  return updatedAtComparison === 0 ? right.id.localeCompare(left.id) : updatedAtComparison;
}

export function encodeJournalEntriesCursor(entry: EncryptedJournalEntry): Base64Url {
  return valueToBase64Url({ id: entry.id, updatedAt: entry.updatedAt });
}

export function decodeJournalEntriesCursor(
  cursor: Base64Url,
): JournalEntriesCursorData | undefined {
  try {
    return journalEntriesCursorDataSchema.safeParse(base64ToValue(cursor)).data;
  } catch {
    return undefined;
  }
}

export function entryIsAfterCursor(entry: EncryptedJournalEntry, cursor: JournalEntriesCursorData) {
  return (
    entry.updatedAt < cursor.updatedAt ||
    (entry.updatedAt === cursor.updatedAt && entry.id < cursor.id)
  );
}
