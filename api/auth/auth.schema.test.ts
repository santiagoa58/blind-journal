import { describe, expect, it } from "vitest";
import {
  MAX_PASSWORD_LENGTH,
  MAX_USERNAME_LENGTH,
  MIN_PASSWORD_LENGTH,
} from "@/api/auth/auth.constants";
import {
  createAccountRequestSchema,
  normalizeUsername,
  passwordSchema,
  saltRequestSchema,
  verifyCredentialsRequestSchema,
} from "@/api/auth/auth.schema";
import { CURRENT_AUTH_KEY_SCHEDULE } from "@/api/auth/auth-key-schedule";
import { toBase64 } from "@/crypto/base64";

const USERNAME = "journal_user";

function encodedKey(byteLength: number) {
  return toBase64(new Uint8Array(byteLength));
}

describe("authentication key request validation", () => {
  it("accepts the protocol's decoded authentication key length", () => {
    const authKey = encodedKey(CURRENT_AUTH_KEY_SCHEDULE.authenticationKey.outputLengthBytes);
    const salt = encodedKey(CURRENT_AUTH_KEY_SCHEDULE.passwordKdf.saltLengthBytes);
    const input = {
      username: USERNAME,
      authKey,
      keyScheduleVersion: CURRENT_AUTH_KEY_SCHEDULE.version,
    };

    expect(createAccountRequestSchema.safeParse({ ...input, salt }).success).toBe(true);
    expect(verifyCredentialsRequestSchema.safeParse(input).success).toBe(true);
  });

  it.each([
    CURRENT_AUTH_KEY_SCHEDULE.authenticationKey.outputLengthBytes - 1,
    CURRENT_AUTH_KEY_SCHEDULE.authenticationKey.outputLengthBytes + 1,
  ])("rejects a valid base64 key containing %i decoded bytes", (byteLength) => {
    const authKey = encodedKey(byteLength);
    const salt = encodedKey(CURRENT_AUTH_KEY_SCHEDULE.passwordKdf.saltLengthBytes);

    const input = {
      username: USERNAME,
      authKey,
      keyScheduleVersion: CURRENT_AUTH_KEY_SCHEDULE.version,
    };

    expect(createAccountRequestSchema.safeParse({ ...input, salt }).success).toBe(false);
    expect(verifyCredentialsRequestSchema.safeParse(input).success).toBe(false);
  });

  it.each([undefined, 2])("rejects unsupported key schedule version %s", (version) => {
    const input = {
      username: USERNAME,
      authKey: encodedKey(CURRENT_AUTH_KEY_SCHEDULE.authenticationKey.outputLengthBytes),
      ...(version === undefined ? {} : { keyScheduleVersion: version }),
    };

    expect(
      createAccountRequestSchema.safeParse({
        ...input,
        salt: encodedKey(CURRENT_AUTH_KEY_SCHEDULE.passwordKdf.saltLengthBytes),
      }).success,
    ).toBe(false);
    expect(verifyCredentialsRequestSchema.safeParse(input).success).toBe(false);
  });

  it("requires a registration salt with the protocol's decoded length", () => {
    const input = {
      username: USERNAME,
      authKey: encodedKey(CURRENT_AUTH_KEY_SCHEDULE.authenticationKey.outputLengthBytes),
      keyScheduleVersion: CURRENT_AUTH_KEY_SCHEDULE.version,
    };

    expect(createAccountRequestSchema.safeParse(input).success).toBe(false);
    expect(
      createAccountRequestSchema.safeParse({
        ...input,
        salt: encodedKey(CURRENT_AUTH_KEY_SCHEDULE.passwordKdf.saltLengthBytes - 1),
      }).success,
    ).toBe(false);
  });
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
  ])("accepts a password within the policy bounds", (password) => {
    expect(passwordSchema.safeParse(password).success).toBe(true);
  });

  it.each(["x".repeat(MIN_PASSWORD_LENGTH - 1), "x".repeat(MAX_PASSWORD_LENGTH + 1)])(
    "rejects a password outside the policy bounds",
    (password) => {
      expect(passwordSchema.safeParse(password).success).toBe(false);
    },
  );

  it("does not trim or otherwise modify password input", () => {
    const password = "  correct horse battery staple  ";
    expect(passwordSchema.parse(password)).toBe(password);
  });
});
