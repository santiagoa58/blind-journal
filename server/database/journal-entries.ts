import "server-only";

import { z } from "zod";
import { encryptedJournalEntrySchema } from "@/api/journal/journal.schema";
import type { EncryptedJournalEntry } from "@/api/journal/journal.type";
import { getDatabase } from "@/server/database/client";
import {
  decodeJournalEntriesCursor,
  encodeJournalEntriesCursor,
} from "@/server/journal/pagination";
import type { Base64Url } from "@/types/base64";

const JOURNAL_QUOTA_CONSTRAINT = "journal_entries_account_quota";

export type JournalEntriesPageRecord = {
  entries: EncryptedJournalEntry[];
  nextCursor: Base64Url | null;
};

export type JournalCreateResult = "created" | "entry-already-exists" | "quota-exceeded";

export type JournalUpdateResult =
  | { status: "updated"; entry: EncryptedJournalEntry }
  | { status: "entry-not-found" | "quota-exceeded" };

const journalEntryRowSchema = z.object({
  id: z.uuid(),
  encryption_version: z.literal(1),
  wrapped_key_base64: z.base64(),
  ciphertext_base64: z.base64(),
  iv_base64: z.base64(),
  created_at: z.union([z.string(), z.date()]),
  updated_at: z.union([z.string(), z.date()]),
});

function toIsoDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.valueOf())) {
    throw new Error("The database returned an invalid timestamp.");
  }
  return date.toISOString();
}

function toJournalEntry(row: unknown): EncryptedJournalEntry {
  const parsed = journalEntryRowSchema.parse(row);
  return encryptedJournalEntrySchema.parse({
    id: parsed.id,
    createdAt: toIsoDate(parsed.created_at),
    updatedAt: toIsoDate(parsed.updated_at),
    encryptedData: {
      version: parsed.encryption_version,
      wrappedKeyBase64: parsed.wrapped_key_base64,
      ciphertextBase64: parsed.ciphertext_base64,
      ivBase64: parsed.iv_base64,
    },
  });
}

function isJournalQuotaError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const record = error as Record<string, unknown>;
  return record["code"] === "23514" && record["constraint"] === JOURNAL_QUOTA_CONSTRAINT;
}

export async function deleteJournalEntry(userId: string, entryId: string): Promise<boolean> {
  const sql = getDatabase();
  const rows = await sql`
    DELETE FROM journal_entries
    WHERE user_id = ${userId}::uuid AND id = ${entryId}::uuid
    RETURNING id
  `;
  return rows.length === 1;
}

export async function getJournalEntriesPage(
  userId: string,
  cursor: Base64Url | undefined,
  pageSize: number,
): Promise<JournalEntriesPageRecord | undefined> {
  const decodedCursor = cursor ? decodeJournalEntriesCursor(cursor) : undefined;
  if (cursor && !decodedCursor) {
    return undefined;
  }

  const sql = getDatabase();
  const rowLimit = pageSize + 1;
  const rows = decodedCursor
    ? await sql`
        SELECT
          id,
          encryption_version,
          wrapped_key_base64,
          ciphertext_base64,
          iv_base64,
          created_at,
          updated_at
        FROM journal_entries
        WHERE
          user_id = ${userId}::uuid
          AND (updated_at, id) < (${decodedCursor.updatedAt}::timestamptz, ${decodedCursor.id}::uuid)
        ORDER BY updated_at DESC, id DESC
        LIMIT ${rowLimit}
      `
    : await sql`
        SELECT
          id,
          encryption_version,
          wrapped_key_base64,
          ciphertext_base64,
          iv_base64,
          created_at,
          updated_at
        FROM journal_entries
        WHERE user_id = ${userId}::uuid
        ORDER BY updated_at DESC, id DESC
        LIMIT ${rowLimit}
      `;
  const entries = rows.map(toJournalEntry);
  const hasMore = entries.length > pageSize;
  const pageEntries = hasMore ? entries.slice(0, pageSize) : entries;
  const lastEntry = pageEntries.at(-1);

  return {
    entries: pageEntries,
    nextCursor: hasMore && lastEntry ? encodeJournalEntriesCursor(lastEntry) : null,
  };
}

export async function insertJournalEntry(
  userId: string,
  entry: EncryptedJournalEntry,
): Promise<JournalCreateResult> {
  const sql = getDatabase();
  try {
    const rows = await sql`
      INSERT INTO journal_entries (
        user_id,
        id,
        encryption_version,
        wrapped_key_base64,
        ciphertext_base64,
        iv_base64,
        created_at,
        updated_at
      )
      VALUES (
        ${userId}::uuid,
        ${entry.id}::uuid,
        ${entry.encryptedData.version},
        ${entry.encryptedData.wrappedKeyBase64},
        ${entry.encryptedData.ciphertextBase64},
        ${entry.encryptedData.ivBase64},
        ${entry.createdAt}::timestamptz,
        ${entry.updatedAt}::timestamptz
      )
      ON CONFLICT (user_id, id) DO NOTHING
      RETURNING id
    `;
    return rows.length === 1 ? "created" : "entry-already-exists";
  } catch (error) {
    if (isJournalQuotaError(error)) {
      return "quota-exceeded";
    }
    throw error;
  }
}

export async function replaceJournalEntry(
  userId: string,
  entryId: string,
  encryptedData: EncryptedJournalEntry["encryptedData"],
  updatedAt: string,
): Promise<JournalUpdateResult> {
  const sql = getDatabase();
  try {
    const rows = await sql`
      UPDATE journal_entries
      SET
        encryption_version = ${encryptedData.version},
        wrapped_key_base64 = ${encryptedData.wrappedKeyBase64},
        ciphertext_base64 = ${encryptedData.ciphertextBase64},
        iv_base64 = ${encryptedData.ivBase64},
        updated_at = ${updatedAt}::timestamptz
      WHERE user_id = ${userId}::uuid AND id = ${entryId}::uuid
      RETURNING
        id,
        encryption_version,
        wrapped_key_base64,
        ciphertext_base64,
        iv_base64,
        created_at,
        updated_at
    `;
    return rows[0]
      ? { status: "updated", entry: toJournalEntry(rows[0]) }
      : { status: "entry-not-found" };
  } catch (error) {
    if (isJournalQuotaError(error)) {
      return { status: "quota-exceeded" };
    }
    throw error;
  }
}
