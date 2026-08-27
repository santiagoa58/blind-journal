import { afterEach, describe, expect, it, vi } from "vitest";
import { AUTH_ERROR_CODES } from "@/api/auth/auth.error";
import { CURRENT_AUTH_KEY_SCHEDULE } from "@/api/auth/auth-key-schedule";
import { toBase64 } from "@/crypto/base64";
import { createAccount, getAuthSalt, verifyCredentials } from "@/server/auth/auth";
import type { StoredUser } from "@/server/database/accounts";

const accountDatabaseMocks = vi.hoisted(() => ({
  createUserWithSession: vi.fn(),
  findUserByUsername: vi.fn(),
}));
const environmentMocks = vi.hoisted(() => ({ getServerEnvironment: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/server/database/accounts", () => accountDatabaseMocks);
vi.mock("@/server/environment", () => environmentMocks);

const AUTH_KEY = toBase64(new Uint8Array(32).fill(1));
const OTHER_AUTH_KEY = toBase64(new Uint8Array(32).fill(2));

async function authKeyHash(authKey: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(authKey));
  return toBase64(new Uint8Array(digest));
}

afterEach(() => {
  vi.clearAllMocks();
});

environmentMocks.getServerEnvironment.mockReturnValue({
  authSaltSecret: Buffer.from("blind-journal-development-only-auth-salt-secret"),
});

describe("authentication domain", () => {
  it("returns stable decoy salt metadata without exposing account existence", async () => {
    accountDatabaseMocks.findUserByUsername.mockResolvedValue(undefined);

    const first = await getAuthSalt({ username: " Unknown.User " });
    const normalized = await getAuthSalt({ username: "unknown.user" });
    const different = await getAuthSalt({ username: "another-user" });

    expect(first).toEqual(normalized);
    expect(first).not.toEqual(different);
    expect(first).toMatchObject({
      success: true,
      data: { keyScheduleVersion: CURRENT_AUTH_KEY_SCHEDULE.version, salt: expect.any(String) },
    });
  });

  it("returns persisted key metadata for an existing account", async () => {
    const salt = toBase64(new Uint8Array(16).fill(3));
    accountDatabaseMocks.findUserByUsername.mockResolvedValue({
      id: crypto.randomUUID(),
      username: "existing-user",
      displayName: "existing-user",
      authKeyHash: await authKeyHash(AUTH_KEY),
      keyScheduleVersion: 1,
      salt,
    } satisfies StoredUser);

    await expect(getAuthSalt({ username: "EXISTING-USER" })).resolves.toEqual({
      success: true,
      data: { keyScheduleVersion: 1, salt },
    });
  });

  it("atomically creates a normalized account and hashed session", async () => {
    accountDatabaseMocks.findUserByUsername.mockResolvedValue(undefined);
    accountDatabaseMocks.createUserWithSession.mockResolvedValue(true);
    const saltResult = await getAuthSalt({ username: " Journal.User " });
    if (!saltResult.success) throw new Error("Salt generation failed.");

    const result = await createAccount({
      username: " Journal.User ",
      authKey: AUTH_KEY,
      keyScheduleVersion: 1,
      salt: saltResult.data.salt,
    });

    expect(result).toMatchObject({
      success: true,
      data: {
        apiSession: {
          user: { username: "journal.user", displayName: "Journal.User" },
        },
        sessionId: expect.stringMatching(/^[A-Za-z0-9_-]{43}$/),
      },
    });
    expect(accountDatabaseMocks.createUserWithSession).toHaveBeenCalledWith(
      expect.objectContaining({
        username: "journal.user",
        displayName: "Journal.User",
        authKeyHash: await authKeyHash(AUTH_KEY),
      }),
      expect.objectContaining({
        sessionHash: expect.stringMatching(/^[0-9a-f]{64}$/),
      }),
      undefined,
    );
  });

  it("rejects a substituted registration salt before writing anything", async () => {
    const result = await createAccount({
      username: "journal-user",
      authKey: AUTH_KEY,
      keyScheduleVersion: 1,
      salt: toBase64(new Uint8Array(16).fill(9)),
    });

    expect(result).toEqual({
      success: false,
      error: { code: AUTH_ERROR_CODES.invalidCredentials },
    });
    expect(accountDatabaseMocks.createUserWithSession).not.toHaveBeenCalled();
  });

  it("returns a generic failure when username uniqueness rejects registration", async () => {
    accountDatabaseMocks.findUserByUsername.mockResolvedValue(undefined);
    accountDatabaseMocks.createUserWithSession.mockResolvedValue(false);
    const saltResult = await getAuthSalt({ username: "existing-user" });
    if (!saltResult.success) throw new Error("Salt generation failed.");

    await expect(
      createAccount({
        username: "existing-user",
        authKey: AUTH_KEY,
        keyScheduleVersion: 1,
        salt: saltResult.data.salt,
      }),
    ).resolves.toEqual({
      success: false,
      error: { code: AUTH_ERROR_CODES.invalidCredentials },
    });
  });

  it("verifies matching credentials and keeps all failures generic", async () => {
    const user = {
      id: crypto.randomUUID(),
      username: "journal-user",
      displayName: "journal-user",
      authKeyHash: await authKeyHash(AUTH_KEY),
      keyScheduleVersion: 1,
      salt: toBase64(new Uint8Array(16)),
    } satisfies StoredUser;
    accountDatabaseMocks.findUserByUsername.mockResolvedValue(user);

    await expect(
      verifyCredentials({
        username: user.username,
        authKey: AUTH_KEY,
        keyScheduleVersion: 1,
      }),
    ).resolves.toEqual({
      success: true,
      data: { user: { id: user.id, username: user.username, displayName: user.displayName } },
    });
    await expect(
      verifyCredentials({
        username: user.username,
        authKey: OTHER_AUTH_KEY,
        keyScheduleVersion: 1,
      }),
    ).resolves.toEqual({
      success: false,
      error: { code: AUTH_ERROR_CODES.invalidCredentials },
    });
  });

  it("performs the hash comparison even when the account does not exist", async () => {
    accountDatabaseMocks.findUserByUsername.mockResolvedValue(undefined);
    const digestSpy = vi.spyOn(crypto.subtle, "digest");

    await expect(
      verifyCredentials({
        username: "unknown-user",
        authKey: AUTH_KEY,
        keyScheduleVersion: 1,
      }),
    ).resolves.toEqual({
      success: false,
      error: { code: AUTH_ERROR_CODES.invalidCredentials },
    });
    expect(digestSpy).toHaveBeenCalledOnce();
    digestSpy.mockRestore();
  });
});
