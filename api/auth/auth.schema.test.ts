import { describe, expect, it } from "vitest";
import {
  AUTH_KEY_LENGTH_BYTES,
  MAX_PASSWORD_LENGTH,
  MAX_USERNAME_LENGTH,
  MIN_PASSWORD_LENGTH,
} from "@/api/auth/auth.constants";
import {
  createAccountRequestSchema,
  loginPasswordSchema,
  newPasswordSchema,
  normalizeUsername,
  saltRequestSchema,
  verifyCredentialsRequestSchema,
} from "@/api/auth/auth.schema";
import { uint8ArrayToBase64 } from "@/crypto/base64";

const USERNAME = "journal_user";

function encodedKey(byteLength: number) {
  return uint8ArrayToBase64(new Uint8Array(byteLength));
}

describe("authentication key request validation", () => {
  it("accepts the protocol's decoded authentication key length", () => {
    const authKey = encodedKey(AUTH_KEY_LENGTH_BYTES);

    expect(createAccountRequestSchema.safeParse({ username: USERNAME, authKey }).success).toBe(
      true,
    );
    expect(verifyCredentialsRequestSchema.safeParse({ username: USERNAME, authKey }).success).toBe(
      true,
    );
  });

  it.each([AUTH_KEY_LENGTH_BYTES - 1, AUTH_KEY_LENGTH_BYTES + 1])(
    "rejects a valid base64 key containing %i decoded bytes",
    (byteLength) => {
      const authKey = encodedKey(byteLength);

      expect(createAccountRequestSchema.safeParse({ username: USERNAME, authKey }).success).toBe(
        false,
      );
      expect(
        verifyCredentialsRequestSchema.safeParse({ username: USERNAME, authKey }).success,
      ).toBe(false);
    },
  );
});

describe("username validation", () => {
  it.each(["a", "Journal.User_1-test", "a".repeat(MAX_USERNAME_LENGTH)])(
    "accepts %s",
    (username) => {
      expect(saltRequestSchema.safeParse({ username }).success).toBe(true);
    },
  );

  it.each(["", "   ", "a".repeat(MAX_USERNAME_LENGTH + 1), "journal user", "josé", "journal/user"])(
    "rejects %s",
    (username) => {
      expect(saltRequestSchema.safeParse({ username }).success).toBe(false);
    },
  );

  it("trims display input and normalizes identity consistently", () => {
    expect(saltRequestSchema.parse({ username: "  Journal.User  " }).username).toBe("Journal.User");
    expect(normalizeUsername("  Journal.User  ")).toBe("journal.user");
  });
});

describe("password validation", () => {
  it.each([
    "correct horse battery staple",
    "contraseña larga y memorable",
    "x".repeat(MIN_PASSWORD_LENGTH),
    "x".repeat(MAX_PASSWORD_LENGTH),
  ])("accepts a new password within the policy bounds", (password) => {
    expect(newPasswordSchema.safeParse(password).success).toBe(true);
  });

  it.each(["x".repeat(MIN_PASSWORD_LENGTH - 1), "x".repeat(MAX_PASSWORD_LENGTH + 1)])(
    "rejects a new password outside the policy bounds",
    (password) => {
      expect(newPasswordSchema.safeParse(password).success).toBe(false);
    },
  );

  it("allows an existing shorter password at login without allowing unbounded input", () => {
    expect(loginPasswordSchema.safeParse("legacy password").success).toBe(true);
    expect(loginPasswordSchema.safeParse("").success).toBe(false);
    expect(loginPasswordSchema.safeParse("x".repeat(MAX_PASSWORD_LENGTH + 1)).success).toBe(false);
  });

  it("does not trim or otherwise modify password input", () => {
    const password = "  correct horse battery staple  ";
    expect(newPasswordSchema.parse(password)).toBe(password);
  });
});
