import { beforeEach, describe, expect, it } from "vitest";
import type { ClientUser } from "@/api/auth/user.type";
import {
  createJournalEntry,
  deleteJournalEntry,
  listJournalEntries,
  updateJournalEntry,
} from "@/api/journal/journal";
import { localServerStore, type StoredUser } from "@/local-server/store";

describe("journal API", () => {
  let clientUser: ClientUser;

  beforeEach(async () => {
    const user = {
      id: "journal-user",
      username: "journal_writer",
      displayName: "Journal Writer",
      authKeyHash: "unused-by-journal-tests",
      salt: "unused-by-journal-tests",
    } satisfies StoredUser;

    localServerStore.users.push(user);
    localServerStore.entriesByUserId[user.id] = [];
    localServerStore.activeUserId = user.id;
    clientUser = {
      ...user,
      keyEncryptionKey: await crypto.subtle.generateKey({ name: "AES-KW", length: 256 }, false, [
        "wrapKey",
        "unwrapKey",
      ]),
    };
  });

  it("supports create, read, update, and delete through the mock HTTP boundary", async () => {
    const created = await createJournalEntry(
      {
        title: "A test entry",
        content: "<p>Written through the client API.</p>",
      },
      clientUser,
    );

    expect(created.success).toBe(true);

    if (!created.success) {
      throw new Error("The entry fixture should have been created.");
    }

    const storedEntries = localServerStore.entriesByUserId[clientUser.id] ?? [];
    expect(storedEntries).toHaveLength(1);
    expect(storedEntries[0]).toMatchObject({
      id: created.data.id,
      encryptedData: {
        version: 1,
        ciphertextBase64: expect.any(String),
        ivBase64: expect.any(String),
        wrappedKeyBase64: expect.any(String),
      },
    });
    expect(JSON.stringify(storedEntries)).not.toContain("A test entry");
    expect(JSON.stringify(storedEntries)).not.toContain("Written through the client API");

    const listed = await listJournalEntries(clientUser);
    expect(listed.success && listed.data.some(({ id }) => id === created.data.id)).toBe(true);

    const updated = await updateJournalEntry(
      {
        id: created.data.id,
        title: "An updated test entry",
        content: created.data.content,
        favorite: true,
        tags: created.data.tags,
      },
      clientUser,
    );
    expect(updated).toMatchObject({
      success: true,
      data: {
        id: created.data.id,
        title: "An updated test entry",
        favorite: true,
      },
    });

    await expect(deleteJournalEntry(created.data.id)).resolves.toEqual({
      success: true,
      data: { id: created.data.id },
    });

    const afterDelete = await listJournalEntries(clientUser);
    expect(afterDelete.success && afterDelete.data.some(({ id }) => id === created.data.id)).toBe(
      false,
    );
  });

  it("rejects ciphertext moved to a different public entry identity", async () => {
    const created = await createJournalEntry(
      { title: "Bound entry", content: "<p>Authenticated content.</p>" },
      clientUser,
    );

    if (!created.success) {
      throw new Error("The entry fixture should have been created.");
    }

    const storedEntry = localServerStore.entriesByUserId[clientUser.id]?.[0];
    if (!storedEntry) {
      throw new Error("The encrypted entry should have been stored.");
    }

    storedEntry.id = crypto.randomUUID();

    await expect(listJournalEntries(clientUser)).rejects.toThrow();
  });
});
