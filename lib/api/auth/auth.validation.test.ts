import { beforeAll, describe, expect, it } from "vitest";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/api/auth/auth.constants";
import { AUTH_CLIENT_ERROR_CODES } from "@/lib/api/auth/auth-client.error";

const USERNAME = "journal_user";
let auth: typeof import("@/lib/api/auth/auth");

beforeAll(async () => {
  auth = await import("@/lib/api/auth/auth");
});

describe("password validation errors", () => {
  it("reports a missing password before starting login", async () => {
    await expect(auth.login({ username: USERNAME, password: "" })).rejects.toMatchObject({
      code: AUTH_CLIENT_ERROR_CODES.passwordRequired,
    });
  });

  it.each([
    (password: string) => auth.login({ username: USERNAME, password }),
    (password: string) =>
      auth.createAccount({ username: USERNAME, password, confirmPassword: password }),
  ])("reports a password below the minimum before starting authentication", async (request) => {
    const password = "x".repeat(MIN_PASSWORD_LENGTH - 1);

    await expect(request(password)).rejects.toMatchObject({
      code: AUTH_CLIENT_ERROR_CODES.passwordTooShort,
    });
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
