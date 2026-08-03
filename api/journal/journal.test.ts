import {
  createJournalEntry,
  deleteJournalEntry,
  listJournalEntries,
  updateJournalEntry,
} from "@/api/journal/journal";
import { localServerStore, type StoredUser } from "@/local-server/store";
import { beforeEach, describe, expect, it } from "vitest";

describe("journal API", () => {
  beforeEach(() => {
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
  });

  it("supports create, read, update, and delete through the mock HTTP boundary", async () => {
    const created = await createJournalEntry({
      title: "A test entry",
      content: "<p>Written through the client API.</p>",
    });

    expect(created.success).toBe(true);

    if (!created.success) {
      throw new Error("The entry fixture should have been created.");
    }

    const listed = await listJournalEntries();
    expect(
      listed.success && listed.data.some(({ id }) => id === created.data.id),
    ).toBe(true);

    const updated = await updateJournalEntry(created.data.id, {
      title: "An updated test entry",
      favorite: true,
    });
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

    const afterDelete = await listJournalEntries();
    expect(
      afterDelete.success &&
        afterDelete.data.some(({ id }) => id === created.data.id),
    ).toBe(false);
  });
});
