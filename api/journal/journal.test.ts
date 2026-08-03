import { getLoginSalt, login } from "@/api/auth/auth";
import {
  createJournalEntry,
  deleteJournalEntry,
  listJournalEntries,
  updateJournalEntry,
} from "@/api/journal/journal";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
  "@/api/auth/auth.crypto",
  async () => import("@/tests/mocks/auth-crypto"),
);

describe("journal API", () => {
  beforeEach(async () => {
    const saltResponse = await getLoginSalt({ username: "summertime" });

    if (!saltResponse.success) {
      throw new Error("The seeded account salt should be available.");
    }

    await login({
      username: "summertime",
      password: "journal123",
      salt: saltResponse.data.salt,
    });
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
