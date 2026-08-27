import "server-only";

import { createHmac } from "node:crypto";
import { CURRENT_AUTH_KEY_SCHEDULE } from "@/api/auth/auth-key-schedule";
import type { Base64 } from "@/types/base64";

// This server-only domain separator is intentionally independent of the client key schedule.
// Accounts persist the generated salt, while the schedule defines how clients use that salt.
const AUTH_SALT_CONTEXT = "blind-journal:auth-salt";
const DEVELOPMENT_AUTH_SALT_SECRET = "blind-journal-development-only-auth-salt-secret";
const MINIMUM_AUTH_SALT_SECRET_BYTES = 32;

function getAuthSaltSecret(): Buffer {
  const encodedSecret = process.env["AUTH_SALT_SECRET"];

  if (!encodedSecret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SALT_SECRET must be configured in production.");
    }

    return Buffer.from(DEVELOPMENT_AUTH_SALT_SECRET);
  }

  if (!/^[A-Za-z0-9_-]+$/.test(encodedSecret)) {
    throw new Error("AUTH_SALT_SECRET must be Base64URL encoded.");
  }

  const secret = Buffer.from(encodedSecret, "base64url");
  if (secret.byteLength < MINIMUM_AUTH_SALT_SECRET_BYTES) {
    throw new Error(
      `AUTH_SALT_SECRET must decode to at least ${MINIMUM_AUTH_SALT_SECRET_BYTES} bytes.`,
    );
  }

  return secret;
}

export function deriveAuthSalt(normalizedUsername: string): Base64 {
  const digest = createHmac("sha256", getAuthSaltSecret())
    .update(AUTH_SALT_CONTEXT)
    .update("\0")
    .update(normalizedUsername)
    .digest();

  return digest
    .subarray(0, CURRENT_AUTH_KEY_SCHEDULE.passwordKdf.saltLengthBytes)
    .toString("base64");
}
