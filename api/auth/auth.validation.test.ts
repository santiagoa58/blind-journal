import { beforeAll, describe, expect, it, vi } from "vitest";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/api/auth/auth.constants";
import { AUTH_CLIENT_ERROR_CODES } from "@/api/auth/auth-client.error";

const USERNAME = "journal_user";
let auth: typeof import("@/api/auth/auth");

beforeAll(async () => {
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "/api/v1");
  auth = await import("@/api/auth/auth");
});

describe("password validation errors", () => {
  it("reports a missing password before starting login", async () => {
    await expect(auth.login({ username: USERNAME, password: "" })).rejects.toMatchObject({
      code: AUTH_CLIENT_ERROR_CODES.passwordRequired,
    });
  });

  it("reports a new password below the minimum", async () => {
    const password = "x".repeat(MIN_PASSWORD_LENGTH - 1);

    await expect(
      auth.createAccount({ username: USERNAME, password, confirmPassword: password }),
    ).rejects.toMatchObject({ code: AUTH_CLIENT_ERROR_CODES.passwordTooShort });
  });

  it.each([
    () => auth.login({ username: USERNAME, password: "x".repeat(MAX_PASSWORD_LENGTH + 1) }),
    () => {
      const password = "x".repeat(MAX_PASSWORD_LENGTH + 1);
      return auth.createAccount({ username: USERNAME, password, confirmPassword: password });
    },
  ])("reports an overlong password before expensive key derivation", async (request) => {
    await expect(request()).rejects.toMatchObject({
      code: AUTH_CLIENT_ERROR_CODES.passwordTooLong,
    });
  });
});
