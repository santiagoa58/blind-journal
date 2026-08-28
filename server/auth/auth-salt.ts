import "server-only";

import { createHmac } from "node:crypto";
import { CURRENT_AUTH_KEY_SCHEDULE } from "@/lib/api/auth/auth-key-schedule";
import { getServerEnvironment } from "@/server/environment";
import type { Base64 } from "@/types/base64";

// This server-only domain separator is intentionally independent of the client key schedule.
// Accounts persist the generated salt, while the schedule defines how clients use that salt.
const AUTH_SALT_CONTEXT = "blind-journal:auth-salt";

export function deriveAuthSalt(normalizedUsername: string): Base64 {
  const digest = createHmac("sha256", getServerEnvironment().authSaltSecret)
    .update(AUTH_SALT_CONTEXT)
    .update("\0")
    .update(normalizedUsername)
    .digest();

  return digest
    .subarray(0, CURRENT_AUTH_KEY_SCHEDULE.passwordKdf.saltLengthBytes)
    .toString("base64");
}
