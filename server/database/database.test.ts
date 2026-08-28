import { afterEach, describe, expect, it, vi } from "vitest";
import type { EncryptedJournalEntry } from "@/api/journal/journal.type";
import { toBase64 } from "@/crypto/base64";
import { createSessionToken } from "@/server/auth/session";
import {
  createUserWithSession,
  deleteAccount,
  findUserByUsername,
  type StoredUser,
} from "@/server/database/accounts";
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
): EncryptedJournalEntry {
  return {
    id,
    createdAt: timestamp,
    updatedAt: timestamp,
    encryptedData: {
      version: 1,
      wrappedKeyBase64: toBase64(new Uint8Array(40).fill(marker)),
      ciphertextBase64: toBase64(new Uint8Array(32).fill(marker)),
      ivBase64: toBase64(new Uint8Array(12).fill(marker)),
    },
  };
}

describe("Neon database", () => {
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
