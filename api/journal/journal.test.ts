import { beforeEach, describe, expect, it } from "vitest";
import type { ClientUser } from "@/api/auth/user.type";
import {
  createJournalEntry,
  deleteJournalEntry,
  listJournalEntries,
  updateJournalEntry,
} from "@/api/journal/journal";
import { JOURNAL_CLIENT_ERROR_CODES } from "@/api/journal/journal-client.error";
import { localServerStore, type StoredUser } from "@/local-server/store";

describe("client journal workflow", () => {
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
        content: "<p>Written through the client workflow.</p>",
      },
      clientUser,
    );

    const storedEntries = localServerStore.entriesByUserId[clientUser.id] ?? [];
    expect(storedEntries).toHaveLength(1);
    expect(storedEntries[0]).toMatchObject({
      id: created.id,
      encryptedData: {
        version: 1,
        ciphertextBase64: expect.any(String),
        ivBase64: expect.any(String),
        wrappedKeyBase64: expect.any(String),
      },
    });
    expect(JSON.stringify(storedEntries)).not.toContain("A test entry");
    expect(JSON.stringify(storedEntries)).not.toContain("Written through the client workflow");

    const listed = await listJournalEntries(clientUser);
    expect(listed.some(({ id }) => id === created.id)).toBe(true);

    const updated = await updateJournalEntry(
      {
        id: created.id,
        title: "An updated test entry",
        content: created.content,
        favorite: true,
        tags: created.tags,
      },
      clientUser,
    );
    expect(updated).toMatchObject({
      id: created.id,
      title: "An updated test entry",
      favorite: true,
    });

    await expect(deleteJournalEntry(created.id)).resolves.toEqual({ id: created.id });

    const afterDelete = await listJournalEntries(clientUser);
    expect(afterDelete.some(({ id }) => id === created.id)).toBe(false);
  });

  it("rejects ciphertext moved to a different public entry identity", async () => {
    await createJournalEntry(
      { title: "Bound entry", content: "<p>Authenticated content.</p>" },
      clientUser,
    );

    const storedEntry = localServerStore.entriesByUserId[clientUser.id]?.[0];
    if (!storedEntry) {
      throw new Error("The encrypted entry should have been stored.");
    }

    storedEntry.id = crypto.randomUUID();

    await expect(listJournalEntries(clientUser)).rejects.toMatchObject({
      name: "JournalClientError",
      code: JOURNAL_CLIENT_ERROR_CODES.decryptionFailed,
    });
  });

  it("reports a locked journal before making an HTTP request", async () => {
    await expect(listJournalEntries(null)).rejects.toMatchObject({
      name: "JournalClientError",
      code: JOURNAL_CLIENT_ERROR_CODES.encryptionKeyUnavailable,
    });
  });
});
