import sodium from "libsodium-wrappers-sumo";
import { beforeAll, describe, expect, it } from "vitest";
import {
  AUTH_KEY_SCHEDULES,
  CURRENT_AUTH_KEY_SCHEDULE,
  getAuthKeySchedule,
} from "@/api/auth/auth-key-schedule";

beforeAll(async () => {
  await sodium.ready;
});

describe("browser password KDF budget", () => {
  it("uses the explicit libsodium interactive Argon2id policy", () => {
    expect(AUTH_KEY_SCHEDULES.v1.passwordKdf.operationsLimit).toBe(
      sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
    );
    expect(AUTH_KEY_SCHEDULES.v1.passwordKdf.memoryLimitBytes).toBe(
      sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
    );
    expect(AUTH_KEY_SCHEDULES.v1.passwordKdf.saltLengthBytes).toBe(sodium.crypto_pwhash_SALTBYTES);
  });

  it("selects version 1 and rejects unsupported protocol versions", () => {
    expect(getAuthKeySchedule(CURRENT_AUTH_KEY_SCHEDULE.version)).toBe(AUTH_KEY_SCHEDULES.v1);
    expect(() => getAuthKeySchedule(2)).toThrow(RangeError);
  });

  it("can allocate the configured budget and derive a master key", () => {
    const { passwordKdf } = AUTH_KEY_SCHEDULES.v1;
    const salt = new Uint8Array(passwordKdf.saltLengthBytes);
    const masterKey = sodium.crypto_pwhash(
      passwordKdf.outputLengthBytes,
      "correct horse battery staple",
      salt,
      passwordKdf.operationsLimit,
      passwordKdf.memoryLimitBytes,
      sodium.crypto_pwhash_ALG_ARGON2ID13,
    );

    try {
      expect(masterKey).toHaveLength(passwordKdf.outputLengthBytes);
    } finally {
      sodium.memzero(masterKey);
    }
  });
});
