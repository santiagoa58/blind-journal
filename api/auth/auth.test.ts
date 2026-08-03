import { createAccount, getLoginSalt, login, logout } from "@/api/auth/auth";
import { AUTH_ERROR_CODES } from "@/api/auth/auth.error";
import type { LoginResponse } from "@/api/auth/auth.type";
import { API_BASE_URL } from "@/api/constants";
import { mockServer } from "@/tests/mocks/server";
import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";

vi.mock(
  "@/api/auth/auth.crypto",
  async () => import("@/tests/mocks/auth-crypto"),
);

async function getSeededSalt() {
  const response = await getLoginSalt({ username: "  summertime  " });

  if (!response.success) {
    throw new Error("The seeded account salt should be available.");
  }

  return response.data.salt;
}

describe("auth API", () => {
  it("retrieves an existing user's salt before accepting a password", async () => {
    await expect(getLoginSalt({ username: "  summertime  " })).resolves.toEqual(
      {
        success: true,
        data: { salt: "AAECAwQFBgcICQoLDA0ODw==" },
      },
    );
  });

  it("does not issue a login salt for an unknown username", async () => {
    await expect(getLoginSalt({ username: "unknown_user" })).resolves.toEqual({
      success: false,
      error: { code: AUTH_ERROR_CODES.invalidCredentials },
    });
  });

  it("derives and verifies the seeded account through the two-request login flow", async () => {
    const salt = await getSeededSalt();

    await expect(
      login({ username: "summertime", password: "journal123", salt }),
    ).resolves.toEqual({
      success: true,
      data: {
        user: {
          id: "user-1",
          username: "summertime",
          displayName: "Summer Time",
        },
      },
    });
  });

  it("returns a stable code when the derived auth key does not match", async () => {
    const salt = await getSeededSalt();

    await expect(
      login({ username: "summertime", password: "incorrect", salt }),
    ).resolves.toEqual({
      success: false,
      error: { code: AUTH_ERROR_CODES.invalidCredentials },
    });
  });

  it("creates an account with a server-issued salt that can be used for a later login", async () => {
    const account = {
      username: "new_writer",
      password: "private-journal",
      confirmPassword: "private-journal",
    };

    const created = await createAccount(account);

    expect(created).toMatchObject({
      success: true,
      data: {
        user: {
          username: "new_writer",
          displayName: "new_writer",
        },
      },
    });

    await logout();
    const saltResponse = await getLoginSalt({ username: account.username });

    if (!saltResponse.success) {
      throw new Error(
        "The new account salt should be available after registration.",
      );
    }

    await expect(
      login({
        username: account.username,
        password: account.password,
        salt: saltResponse.data.salt,
      }),
    ).resolves.toMatchObject({
      success: true,
      data: { user: { username: account.username } },
    });
  });

  it("rejects mismatched account passwords before registration", async () => {
    await expect(
      createAccount({
        username: "new_writer",
        password: "private-journal",
        confirmPassword: "different-password",
      }),
    ).resolves.toEqual({
      success: false,
      error: { code: AUTH_ERROR_CODES.passwordsMismatch },
    });
  });

  it("preserves a stable server error code without client normalization", async () => {
    const response = {
      success: false,
      error: { code: "AUTH_RATE_LIMITED" },
    } satisfies LoginResponse;
    const salt = await getSeededSalt();

    mockServer.use(
      http.post(`${API_BASE_URL}/auth/login`, () =>
        HttpResponse.json(response, { status: 429 }),
      ),
    );

    await expect(
      login({ username: "summertime", password: "journal123", salt }),
    ).resolves.toEqual(response);
  });

  it("leaves salt transport failures as ordinary request errors", async () => {
    mockServer.use(
      http.post(`${API_BASE_URL}/auth/login/salt`, () => HttpResponse.error()),
    );

    await expect(
      getLoginSalt({ username: "offline-user" }),
    ).rejects.toBeInstanceOf(Error);
  });
});
