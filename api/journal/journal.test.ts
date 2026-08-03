import { beforeEach, describe, expect, it } from "vitest";
import { login } from "@/api/auth/auth";
import {
  createJournalEntry,
  deleteJournalEntry,
  listJournalEntries,
  updateJournalEntry,
} from "@/api/journal/journal";

describe("journal API", () => {
  beforeEach(async () => {
    await login({ username: "summertime", password: "journal123" });
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
    expect(listed.success && listed.data.some(({ id }) => id === created.data.id)).toBe(true);

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
    expect(afterDelete.success && afterDelete.data.some(({ id }) => id === created.data.id)).toBe(
      false,
    );
  });
});
