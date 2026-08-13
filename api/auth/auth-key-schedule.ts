const BYTES_PER_MEBIBYTE = 1_024 * 1_024;

export const AUTH_KEY_SCHEDULES = {
  v1: {
    version: 1,
    passwordKdf: {
      algorithm: "argon2id13",
      operationsLimit: 2,
      memoryLimitBytes: 64 * BYTES_PER_MEBIBYTE,
      saltLengthBytes: 16,
      outputLengthBytes: 32,
    },
    keyDerivation: {
      algorithm: "HKDF",
      hash: "SHA-256",
      saltLengthBytes: 0,
    },
    authenticationKey: {
      context: "auth-key-context",
      outputLengthBytes: 32,
    },
    keyEncryptionKey: {
      context: "encrypt-key-context",
      algorithm: "AES-KW",
      lengthBits: 256,
    },
  },
} as const;

export type AuthKeyScheduleVersion =
  (typeof AUTH_KEY_SCHEDULES)[keyof typeof AUTH_KEY_SCHEDULES]["version"];

export const CURRENT_AUTH_KEY_SCHEDULE = AUTH_KEY_SCHEDULES.v1;

export function getAuthKeySchedule(version: number) {
  if (version === AUTH_KEY_SCHEDULES.v1.version) {
    return AUTH_KEY_SCHEDULES.v1;
  }

  throw new RangeError(`Unsupported authentication key schedule version: ${version}`);
}
