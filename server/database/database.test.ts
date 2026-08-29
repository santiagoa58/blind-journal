import { afterEach, describe, expect, it, vi } from "vitest";
import { toBase64 } from "@/crypto/base64";
import type { EncryptedJournalEntry } from "@/lib/api/journal/journal.type";
import { createSessionToken } from "@/server/auth/session";
import {
  createUserWithSession,
  deleteAccount,
  findUserByUsername,
  type StoredUser,
} from "@/server/database/accounts";
import { getDatabase } from "@/server/database/client";
import {
  deleteJournalEntry,
  getJournalEntriesPage,
  insertJournalEntry,
  replaceJournalEntry,
} from "@/server/database/journal-entries";
import { findSessionUserId } from "@/server/database/sessions";

vi.mock("server-only", () => ({}));

const createdUserIds = new Set<string>();

afterEach(async () => {
  await Promise.all(
    [...createdUserIds].map(async (userId) => {
      await deleteAccount(userId);
      createdUserIds.delete(userId);
    }),
  );
});

function encryptedEntry(
  id: string,
  marker: number,
  timestamp = new Date().toISOString(),
  ciphertextBytes = 32,
): EncryptedJournalEntry {
  return {
    id,
    createdAt: timestamp,
    updatedAt: timestamp,
    encryptedData: {
      version: 1,
      wrappedKeyBase64: toBase64(new Uint8Array(40).fill(marker)),
      ciphertextBase64: toBase64(new Uint8Array(ciphertextBytes).fill(marker)),
      ivBase64: toBase64(new Uint8Array(12).fill(marker)),
    },
  };
}

describe("Neon database", () => {
  it("enforces the least-privilege runtime role and quota trigger contract", async () => {
    const sql = getDatabase();
    const contractRows = await sql`
      SELECT
        has_schema_privilege(current_user, 'public', 'CREATE') AS can_create_in_public,
        has_table_privilege(current_user, 'public.users', 'TRUNCATE') AS can_truncate_users,
        has_table_privilege(current_user, 'public.users', 'INSERT') AS has_table_insert_on_users,
        has_table_privilege(
          current_user,
          'public.journal_entries',
          'INSERT'
        ) AS has_table_insert_on_entries,
        has_table_privilege(
          current_user,
          'public.journal_entries',
          'UPDATE'
        ) AS has_table_update_on_entries,
        has_column_privilege(
          current_user,
          'public.users',
          'entry_count',
          'UPDATE'
        ) AS can_update_entry_count,
        has_column_privilege(
          current_user,
          'public.users',
          'encrypted_bytes',
          'UPDATE'
        ) AS can_update_encrypted_bytes,
        pg_get_userbyid(procedure.proowner) <> current_user AS function_owned_by_separate_role,
        procedure.prosecdef AS function_is_security_definer,
        has_function_privilege(
          current_user,
          'public.maintain_journal_account_usage()',
          'EXECUTE'
        ) AS application_can_execute_function,
        NOT EXISTS (
          SELECT
          FROM aclexplode(
            COALESCE(procedure.proacl, acldefault('f', procedure.proowner))
          ) AS privilege
          WHERE
            privilege.grantee = 0
            AND privilege.privilege_type = 'EXECUTE'
        ) AS function_not_publicly_executable,
        'search_path=pg_catalog, pg_temp' = ANY(
          COALESCE(procedure.proconfig, ARRAY[]::text[])
        ) AS function_has_safe_search_path
      FROM pg_proc AS procedure
      INNER JOIN pg_namespace AS namespace
        ON namespace.oid = procedure.pronamespace
      WHERE
        namespace.nspname = 'public'
        AND procedure.proname = 'maintain_journal_account_usage'
        AND pg_get_function_identity_arguments(procedure.oid) = ''
    `;

    expect(contractRows).toEqual([
      {
        can_create_in_public: false,
        can_truncate_users: false,
        has_table_insert_on_users: false,
        has_table_insert_on_entries: false,
        has_table_update_on_entries: false,
        can_update_entry_count: false,
        can_update_encrypted_bytes: false,
        function_owned_by_separate_role: true,
        function_is_security_definer: true,
        application_can_execute_function: true,
        function_not_publicly_executable: true,
        function_has_safe_search_path: true,
      },
    ]);

    const id = crypto.randomUUID();
    const username = `database-security-test-${id}`;
    const user: StoredUser = {
      id,
      username,
      displayName: username,
      authKeyHash: toBase64(new Uint8Array(32)),
      keyScheduleVersion: 1,
      salt: toBase64(new Uint8Array(16)),
    };
    expect(await createUserWithSession(user, createSessionToken(id).session)).toBe(true);
    createdUserIds.add(id);

    const readUsage = async () => {
      const rows = await sql`
        SELECT entry_count, encrypted_bytes::integer AS encrypted_bytes
        FROM users
        WHERE id = ${id}::uuid
      `;
      return rows[0];
    };

    await expect(
      sql`UPDATE users SET entry_count = 1 WHERE id = ${id}::uuid`,
    ).rejects.toMatchObject({ code: "42501" });

    const entry = encryptedEntry(crypto.randomUUID(), 1);
    await expect(insertJournalEntry(id, entry)).resolves.toBe("created");
    await expect(readUsage()).resolves.toEqual({ entry_count: 1, encrypted_bytes: 116 });

    const replacement = encryptedEntry(entry.id, 2, entry.updatedAt, 64);
    await expect(
      replaceJournalEntry(id, entry.id, replacement.encryptedData, replacement.updatedAt),
    ).resolves.toMatchObject({ status: "updated" });
    await expect(readUsage()).resolves.toEqual({ entry_count: 1, encrypted_bytes: 160 });

    await expect(deleteJournalEntry(id, entry.id)).resolves.toBe(true);
    await expect(readUsage()).resolves.toEqual({ entry_count: 0, encrypted_bytes: 0 });
  });

  it("persists an account, hashed session, and owner-scoped journal lifecycle", async () => {
    const id = crypto.randomUUID();
    const username = `database-test-${id}`;
    const user: StoredUser = {
      id,
      username,
      displayName: username,
      authKeyHash: toBase64(new Uint8Array(32)),
      keyScheduleVersion: 1,
      salt: toBase64(new Uint8Array(16)),
    };
    const { session } = createSessionToken(id);

    expect(await createUserWithSession(user, session)).toBe(true);
    createdUserIds.add(id);
    expect(await createUserWithSession(user, createSessionToken(id).session)).toBe(false);
    await expect(findUserByUsername(username)).resolves.toEqual(user);
    await expect(findSessionUserId(session.sessionHash)).resolves.toBe(id);

    const entry = encryptedEntry(crypto.randomUUID(), 1);
    await expect(insertJournalEntry(id, entry)).resolves.toBe("created");
    await expect(insertJournalEntry(id, entry)).resolves.toBe("entry-already-exists");

    const page = await getJournalEntriesPage(id, undefined, 20);
    expect(page).toEqual({ entries: [entry], nextCursor: null });

    const replacement = encryptedEntry(entry.id, 2);
    const update = await replaceJournalEntry(
      id,
      entry.id,
      replacement.encryptedData,
      replacement.updatedAt,
    );
    expect(update).toMatchObject({
      status: "updated",
      entry: { id: entry.id, encryptedData: replacement.encryptedData },
    });

    await expect(deleteJournalEntry(id, entry.id)).resolves.toBe(true);

    const otherId = crypto.randomUUID();
    const otherUsername = `database-test-${otherId}`;
    const otherUser: StoredUser = {
      ...user,
      id: otherId,
      username: otherUsername,
      displayName: otherUsername,
    };
    expect(await createUserWithSession(otherUser, createSessionToken(otherId).session)).toBe(true);
    createdUserIds.add(otherId);

    const sharedTimestamp = "2026-01-02T03:04:05.000Z";
    const entries = Array.from({ length: 4 }, (_, index) =>
      encryptedEntry(crypto.randomUUID(), index + 3, sharedTimestamp),
    );
    const firstEntry = entries.at(0);
    if (!firstEntry) {
      throw new Error("Expected a pagination fixture.");
    }
    for (const paginatedEntry of entries) {
      await expect(insertJournalEntry(id, paginatedEntry)).resolves.toBe("created");
    }

    const firstPage = await getJournalEntriesPage(id, undefined, 2);
    expect(firstPage?.entries).toHaveLength(2);
    expect(firstPage?.nextCursor).not.toBeNull();
    const secondPage = await getJournalEntriesPage(id, firstPage?.nextCursor ?? undefined, 2);
    expect(secondPage?.entries).toHaveLength(2);
    expect(secondPage?.nextCursor).toBeNull();
    expect(
      new Set([
        ...(firstPage?.entries.map(({ id: entryId }) => entryId) ?? []),
        ...(secondPage?.entries.map(({ id: entryId }) => entryId) ?? []),
      ]),
    ).toEqual(new Set(entries.map(({ id: entryId }) => entryId)));

    await expect(getJournalEntriesPage(otherId, undefined, 20)).resolves.toEqual({
      entries: [],
      nextCursor: null,
    });
    await expect(deleteJournalEntry(otherId, firstEntry.id)).resolves.toBe(false);
    await expect(
      replaceJournalEntry(otherId, firstEntry.id, firstEntry.encryptedData, firstEntry.updatedAt),
    ).resolves.toEqual({ status: "entry-not-found" });

    await expect(deleteAccount(otherId)).resolves.toBe(true);
    createdUserIds.delete(otherId);
    await expect(deleteAccount(id)).resolves.toBe(true);
    createdUserIds.delete(id);
    await expect(findSessionUserId(session.sessionHash)).resolves.toBeUndefined();
  });
});
