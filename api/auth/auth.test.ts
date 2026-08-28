import { describe, expect, it, vi } from "vitest";
import { createAccount, login } from "@/api/auth/auth";
import { AUTH_CLIENT_ERROR_CODES } from "@/api/auth/auth-client.error";
import { CURRENT_AUTH_KEY_SCHEDULE } from "@/api/auth/auth-key-schedule";
import { toBase64 } from "@/crypto/base64";

const apiMocks = vi.hoisted(() => ({ post: vi.fn() }));
const workerMocks = vi.hoisted(() => ({ deriveAuthUserKeysInWorker: vi.fn() }));

vi.mock("@/api/http", () => ({ api: { post: apiMocks.post } }));
vi.mock("@/api/auth/auth-worker-client", () => ({
  deriveAuthUserKeysInWorker: workerMocks.deriveAuthUserKeysInWorker,
}));

const PASSWORD = "correct horse battery staple";
const SALT = toBase64(new Uint8Array(CURRENT_AUTH_KEY_SCHEDULE.passwordKdf.saltLengthBytes));
const AUTH_KEY = toBase64(
  new Uint8Array(CURRENT_AUTH_KEY_SCHEDULE.authenticationKey.outputLengthBytes),
);
const KEY_ENCRYPTION_KEY = {} as CryptoKey;
const USER = {
  id: "00000000-0000-4000-8000-000000000001",
  username: "journal.user",
  displayName: "Journal.User",
};

function jsonResponse(data: unknown) {
  return { json: vi.fn().mockResolvedValue(data) };
}

describe("authentication client orchestration", () => {
  it("derives credentials from the server salt before starting a journal session", async () => {
    apiMocks.post
      .mockReturnValueOnce(
        jsonResponse({
          keyScheduleVersion: CURRENT_AUTH_KEY_SCHEDULE.version,
          salt: SALT,
        }),
      )
      .mockReturnValueOnce(jsonResponse({ user: USER }));
    workerMocks.deriveAuthUserKeysInWorker.mockResolvedValue({
      authKey: AUTH_KEY,
      keyEncryptionKey: KEY_ENCRYPTION_KEY,
    });

    await expect(login({ username: USER.username, password: PASSWORD })).resolves.toEqual({
      ...USER,
      keyEncryptionKey: KEY_ENCRYPTION_KEY,
    });

    expect(apiMocks.post).toHaveBeenNthCalledWith(1, "auth/salt", {
      cache: "no-store",
      json: { username: USER.username },
    });
    expect(workerMocks.deriveAuthUserKeysInWorker).toHaveBeenCalledExactlyOnceWith(
      PASSWORD,
      SALT,
      CURRENT_AUTH_KEY_SCHEDULE.version,
    );
    expect(apiMocks.post).toHaveBeenNthCalledWith(2, "auth/login", {
      cache: "no-store",
      json: {
        username: USER.username,
        authKey: AUTH_KEY,
        keyScheduleVersion: CURRENT_AUTH_KEY_SCHEDULE.version,
      },
    });
  });

  it("uses the same derived credentials and server salt to create an account", async () => {
    apiMocks.post
      .mockReturnValueOnce(
        jsonResponse({
          keyScheduleVersion: CURRENT_AUTH_KEY_SCHEDULE.version,
          salt: SALT,
        }),
      )
      .mockReturnValueOnce(jsonResponse({ user: USER }));
    workerMocks.deriveAuthUserKeysInWorker.mockResolvedValue({
      authKey: AUTH_KEY,
      keyEncryptionKey: KEY_ENCRYPTION_KEY,
    });

    await expect(
      createAccount({
        username: USER.username,
        password: PASSWORD,
        confirmPassword: PASSWORD,
      }),
    ).resolves.toEqual({ ...USER, keyEncryptionKey: KEY_ENCRYPTION_KEY });

    expect(apiMocks.post).toHaveBeenNthCalledWith(2, "auth/accounts", {
      cache: "no-store",
      json: {
        username: USER.username,
        authKey: AUTH_KEY,
        keyScheduleVersion: CURRENT_AUTH_KEY_SCHEDULE.version,
        salt: SALT,
      },
    });
  });

  it("rejects mismatched confirmation before requesting a salt or deriving keys", async () => {
    await expect(
      createAccount({
        username: USER.username,
        password: PASSWORD,
        confirmPassword: `${PASSWORD}!`,
      }),
    ).rejects.toMatchObject({ code: AUTH_CLIENT_ERROR_CODES.passwordsMismatch });

    expect(apiMocks.post).not.toHaveBeenCalled();
    expect(workerMocks.deriveAuthUserKeysInWorker).not.toHaveBeenCalled();
  });
});
