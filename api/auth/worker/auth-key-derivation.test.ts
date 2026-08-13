import { beforeAll, describe, expect, it } from "vitest";
import type { AuthUserKeys } from "@/api/auth/auth.type";
import { deriveAuthUserKeys } from "@/api/auth/worker/auth-key-derivation";
import type { AuthKeyScheduleVersion } from "@/api/auth/auth-key-schedule";
import { CURRENT_AUTH_KEY_SCHEDULE } from "@/api/auth/auth-key-schedule";
import { base64ToUint8Array, toBase64 } from "@/crypto/base64";

const PASSWORD = "correct horse battery staple";
const WRONG_PASSWORD = "correct horse battery stapler";
const SALT = toBase64(Uint8Array.from({ length: 16 }, (_, index) => index));
const CONTENT_KEY_BYTES = Uint8Array.from({ length: 32 }, (_, index) => 255 - index);
const KEY_SCHEDULE_VERSION = CURRENT_AUTH_KEY_SCHEDULE.version;

async function wrapKnownContentKey(keys: AuthUserKeys) {
  const contentKey = await crypto.subtle.importKey(
    "raw",
    CONTENT_KEY_BYTES,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
  const wrappedKey = await crypto.subtle.wrapKey(
    "raw",
    contentKey,
    keys.keyEncryptionKey,
    "AES-KW",
  );

  return toBase64(new Uint8Array(wrappedKey));
}

describe("authentication protocol version 1", () => {
  let expectedKeys: AuthUserKeys;

  beforeAll(async () => {
    expectedKeys = await deriveAuthUserKeys(PASSWORD, SALT, KEY_SCHEDULE_VERSION);
  });

  it("matches its fixed compatibility vector", async () => {
    expect(expectedKeys.authKey).toBe("U1mJbFxdcnUoqRwE4o61G+h/92+AOaMabzdzfbJJixw=");
    await expect(wrapKnownContentKey(expectedKeys)).resolves.toBe(
      "Px1OJDprEgVKIUVymaXxjVBOeDnnaOPtOkgwjlVlX2NZqnVRy7uouQ==",
    );
  });

  it("derives the same keys for the same password and salt", async () => {
    const repeatedKeys = await deriveAuthUserKeys(PASSWORD, SALT, KEY_SCHEDULE_VERSION);

    expect(repeatedKeys.authKey).toBe(expectedKeys.authKey);
    await expect(wrapKnownContentKey(repeatedKeys)).resolves.toBe(
      await wrapKnownContentKey(expectedKeys),
    );
  });

  it("derives different keys for a wrong password", async () => {
    const wrongPasswordKeys = await deriveAuthUserKeys(WRONG_PASSWORD, SALT, KEY_SCHEDULE_VERSION);

    expect(wrongPasswordKeys.authKey).not.toBe(expectedKeys.authKey);
    await expect(wrapKnownContentKey(wrongPasswordKeys)).resolves.not.toBe(
      await wrapKnownContentKey(expectedKeys),
    );
  });

  it("separates the authentication key from the key-encryption key", async () => {
    const authenticationKeyAsKek = await crypto.subtle.importKey(
      "raw",
      base64ToUint8Array(expectedKeys.authKey),
      { name: "AES-KW", length: 256 },
      false,
      ["wrapKey"],
    );
    const contentKey = await crypto.subtle.importKey(
      "raw",
      CONTENT_KEY_BYTES,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"],
    );
    const wrappedWithAuthenticationKey = await crypto.subtle.wrapKey(
      "raw",
      contentKey,
      authenticationKeyAsKek,
      "AES-KW",
    );

    expect(toBase64(new Uint8Array(wrappedWithAuthenticationKey))).not.toBe(
      await wrapKnownContentKey(expectedKeys),
    );
  });

  it.each([
    ["a malformed Base64 salt", "%%%"],
    ["a decoded salt with the wrong length", toBase64(new Uint8Array(15))],
  ])("rejects %s", async (_case, salt) => {
    await expect(deriveAuthUserKeys(PASSWORD, salt, KEY_SCHEDULE_VERSION)).rejects.toThrow();
  });

  it("rejects an unsupported key-schedule version at runtime", async () => {
    await expect(deriveAuthUserKeys(PASSWORD, SALT, 2 as AuthKeyScheduleVersion)).rejects.toThrow(
      "Unsupported authentication key schedule version: 2",
    );
  });
});
