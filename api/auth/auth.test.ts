import { HTTPError } from "ky";
import { describe, expect, it, vi } from "vitest";
import {
  createAccount,
  getCreateAccountSalt,
  getLoginSalt,
  getSession,
  login,
  logout,
} from "@/api/auth/auth";
import { AUTH_ERROR_CODES } from "@/api/auth/auth.error";
import { AUTH_CLIENT_ERROR_CODES } from "@/api/auth/auth-client.error";
import { localServerStore, type StoredUser } from "@/local-server/store";
import { deriveMasterKey, deriveUserKeys } from "@/tests/mocks/auth-crypto";

// TODO(auth-worker): Add a real-browser regression test that exercises the production worker/KDF
// and proves the pending UI and event loop remain responsive while derivation runs. This fast mock
// validates auth contracts but deliberately cannot detect main-thread blocking or worker failures.
// Learn more: https://playwright.dev/docs/api/class-worker
vi.mock("@/api/auth/authWorkerClient", async () => {
  const { deriveMasterKey: deriveMockMasterKey, deriveUserKeys: deriveMockUserKeys } = await import(
    "@/tests/mocks/auth-crypto"
  );

  return {
    getAuthWorker: () => ({
      async getUserKeys(password: string) {
        const masterKey = await deriveMockMasterKey(password);
        const { authKey } = await deriveMockUserKeys(masterKey);
        const keyEncryptionKey = await crypto.subtle.generateKey(
          { name: "AES-KW", length: 256 },
          false,
          ["wrapKey", "unwrapKey"],
        );

        return { authKey, keyEncryptionKey };
      },
      terminate() {},
    }),
    terminateAuthWorker() {},
  };
});

const account = {
  username: "journal_writer",
  password: "private-journal",
};

async function registerAccount() {
  return createAccount({
    ...account,
    confirmPassword: account.password,
  });
}

async function seedUser(): Promise<StoredUser> {
  const masterKey = await deriveMasterKey(account.password);
  const { authKey } = await deriveUserKeys(masterKey);
  const authKeyHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(authKey));
  const id = crypto.randomUUID();
  const user = {
    id,
    username: account.username,
    displayName: account.username,
    salt: btoa("0123456789abcdef"),
    authKeyHash: btoa(String.fromCharCode(...new Uint8Array(authKeyHash))),
  } satisfies StoredUser;

  localServerStore.users.push(user);
  localServerStore.entriesByUserId[id] = [];

  return user;
}

describe("client auth workflow", () => {
  it("creates an account after username validation errors and rejects a duplicate", async () => {
    await expect(getCreateAccountSalt({ username: "" })).rejects.toMatchObject({
      code: AUTH_ERROR_CODES.usernameRequired,
    });
    await expect(getCreateAccountSalt({ username: "ab" })).rejects.toMatchObject({
      code: AUTH_ERROR_CODES.usernameInvalid,
    });

    const sessionError = await getSession().catch((error: unknown) => error);
    expect(sessionError).toBeInstanceOf(HTTPError);
    expect(sessionError).toMatchObject({
      code: AUTH_ERROR_CODES.unauthorized,
      data: { code: AUTH_ERROR_CODES.unauthorized },
    });

    const created = await registerAccount();

    expect(created).toMatchObject({
      user: {
        username: account.username,
        displayName: account.username,
      },
    });
    await expect(getSession()).resolves.toMatchObject({
      user: { username: account.username },
    });

    await logout();

    const saltResponse = await getLoginSalt({ username: account.username });

    expect(saltResponse).toMatchObject({
      salt: expect.any(String),
    });

    expect(saltResponse.salt).not.toHaveLength(0);

    await expect(getCreateAccountSalt({ username: account.username })).rejects.toMatchObject({
      code: AUTH_ERROR_CODES.usernameTaken,
    });
  });

  it("logs in an existing user after credential errors and supports retrying", async () => {
    const user = await seedUser();

    await expect(getLoginSalt({ username: "unknown_writer" })).rejects.toMatchObject({
      code: AUTH_ERROR_CODES.invalidCredentials,
    });

    const saltResponse = await getLoginSalt({ username: account.username });

    expect(saltResponse).toEqual({
      salt: user.salt,
    });

    await expect(
      login({
        username: account.username,
        password: "incorrect-password",
        salt: saltResponse.salt,
      }),
    ).rejects.toMatchObject({
      code: AUTH_ERROR_CODES.invalidCredentials,
    });
    await expect(getSession()).rejects.toMatchObject({
      code: AUTH_ERROR_CODES.unauthorized,
    });

    const loggedIn = await login({
      username: account.username,
      password: account.password,
      salt: saltResponse.salt,
    });

    expect(loggedIn).toMatchObject({
      user: { id: user.id, username: account.username },
    });
    await expect(getSession()).resolves.toMatchObject({
      user: { id: user.id, username: account.username },
    });
  });

  it("keeps client credential validation separate from HTTP errors", async () => {
    await expect(
      createAccount({
        username: account.username,
        password: "short",
        confirmPassword: "short",
      }),
    ).rejects.toMatchObject({
      name: "AuthClientError",
      code: AUTH_CLIENT_ERROR_CODES.passwordTooShort,
    });
  });
});
