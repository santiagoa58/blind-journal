import { z } from "zod";
import { base64ToValue, valueToBase64Url } from "@/crypto/base64";
import { journalEntryIdSchema } from "@/lib/api/journal/journal.schema";
import type { EncryptedJournalEntry } from "@/lib/api/journal/journal.type";
import type { Base64Url } from "@/types/base64";

type JournalEntriesCursorData = Pick<EncryptedJournalEntry, "id" | "updatedAt">;
const journalEntriesCursorDataSchema: z.ZodType<JournalEntriesCursorData> = z.strictObject({
  id: journalEntryIdSchema,
  updatedAt: z.iso.datetime(),
});

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
