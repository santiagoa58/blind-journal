import { describe, expect, it, vi } from "vitest";
import { createAccount, getLoginSalt, getSession, login, logout } from "@/api/auth/auth";
import { AUTH_ERROR_CODES } from "@/api/auth/auth.error";
import { localServerStore, type StoredUser } from "@/local-server/store";
import { deriveMasterKey, deriveUserKeys } from "@/tests/mocks/auth-crypto";

vi.mock("@/api/auth/auth.crypto", async () => import("@/tests/mocks/auth-crypto"));

const account = {
  username: "journal_writer",
  password: "private-journal",
  confirmPassword: "private-journal",
};

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

describe("auth API", () => {
  it("creates an account after validation errors and rejects a duplicate registration", async () => {
    await expect(createAccount({ ...account, password: "", confirmPassword: "" })).resolves.toEqual(
      {
        success: false,
        error: { code: AUTH_ERROR_CODES.passwordRequired },
      },
    );
    await expect(
      createAccount({
        ...account,
        password: "short",
        confirmPassword: "short",
      }),
    ).resolves.toEqual({
      success: false,
      error: { code: AUTH_ERROR_CODES.passwordTooShort },
    });
    await expect(
      createAccount({ ...account, confirmPassword: "different-password" }),
    ).resolves.toEqual({
      success: false,
      error: { code: AUTH_ERROR_CODES.passwordsMismatch },
    });

    await expect(getSession()).resolves.toEqual({
      success: false,
      error: { code: AUTH_ERROR_CODES.unauthorized },
    });

    const created = await createAccount(account);

    expect(created).toMatchObject({
      success: true,
      data: {
        user: {
          username: account.username,
          displayName: account.username,
        },
      },
    });
    await expect(getSession()).resolves.toEqual(created);

    await logout();

    const saltResponse = await getLoginSalt({ username: account.username });

    expect(saltResponse).toMatchObject({
      success: true,
      data: { salt: expect.any(String) },
    });

    if (saltResponse.success) {
      expect(saltResponse.data.salt).not.toHaveLength(0);
    }

    await expect(createAccount(account)).resolves.toEqual({
      success: false,
      error: { code: AUTH_ERROR_CODES.usernameTaken },
    });
  });

  it("logs in an existing user after credential errors and supports retrying", async () => {
    const user = await seedUser();

    await expect(getLoginSalt({ username: "unknown_writer" })).resolves.toEqual({
      success: false,
      error: { code: AUTH_ERROR_CODES.invalidCredentials },
    });

    const saltResponse = await getLoginSalt({ username: account.username });

    expect(saltResponse).toEqual({
      success: true,
      data: { salt: user.salt },
    });

    if (!saltResponse.success) {
      throw new Error("The seeded user's salt should be available.");
    }

    await expect(
      login({
        username: account.username,
        password: "incorrect-password",
        salt: saltResponse.data.salt,
      }),
    ).resolves.toEqual({
      success: false,
      error: { code: AUTH_ERROR_CODES.invalidCredentials },
    });
    await expect(getSession()).resolves.toEqual({
      success: false,
      error: { code: AUTH_ERROR_CODES.unauthorized },
    });

    const loggedIn = await login({
      username: account.username,
      password: account.password,
      salt: saltResponse.data.salt,
    });

    expect(loggedIn).toMatchObject({
      success: true,
      data: { user: { id: user.id, username: account.username } },
    });
    await expect(getSession()).resolves.toEqual(loggedIn);
  });
});
