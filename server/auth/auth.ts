import "server-only";

import sodium from "libsodium-wrappers-sumo";
import { AUTH_ERROR_CODES, type AuthErrorCode } from "@/api/auth/auth.error";
import {
  createAccountRequestSchema,
  requiredUsernameSchema,
  saltRequestSchema,
  verifyCredentialsRequestSchema,
} from "@/api/auth/auth.schema";
import type { ApiAuthSession, ApiSaltResponse } from "@/api/auth/auth.type";
import { CURRENT_AUTH_KEY_SCHEDULE } from "@/api/auth/auth-key-schedule";
import type { ApiUser } from "@/api/auth/user.type";
import { hasOwn } from "@/global-utils";
import { deriveAuthSalt } from "@/server/auth/auth-salt";
import { createSessionToken, toSessionHash } from "@/server/auth/session";
import {
  createUserWithSession,
  findUserByUsername,
  type StoredUser,
} from "@/server/database/accounts";
import type { ServiceResult } from "@/server/service-result";
import type { Base64 } from "@/types/base64";

// TODO(review-high-auth-rate-limit-deployment): Replace this deployment assumption with an
// enforceable, documented control before release. No server-side limiter or repository-visible
// Vercel Firewall rule currently bounds the public salt, registration, or login endpoints. The
// selected control must work across function instances, return a predictable 429 experience, and
// respect the project's free-tier/no-overage constraint.
type AuthServiceResult<TData> = ServiceResult<TData, AuthErrorCode>;
type CreatedAccount = {
  apiSession: ApiAuthSession;
  sessionId: string;
};

// Keep unknown-user logins on the same hash-and-compare path as known users so response timing
// does not reveal whether a username exists. This is the Base64 encoding of a valid 32-byte hash.
const DUMMY_AUTH_KEY_HASH = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=" as Base64;

const INVALID_CREDENTIALS_RESPONSE = {
  success: false,
  error: { code: AUTH_ERROR_CODES.invalidCredentials },
} as const;

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function toPublicUser(user: StoredUser): ApiUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
  };
}

async function hashAuthKey(authKey: Base64): Promise<Uint8Array<ArrayBuffer>> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(authKey));
  return new Uint8Array(digest);
}

async function authKeyMatches(authKey: Base64, storedHash: Base64): Promise<boolean> {
  const candidateHash = await hashAuthKey(authKey);
  await sodium.ready;
  const expectedHash = sodium.from_base64(storedHash, sodium.base64_variants.ORIGINAL);
  return sodium.memcmp(candidateHash, expectedHash);
}

export async function getAuthSalt(input: unknown): Promise<AuthServiceResult<ApiSaltResponse>> {
  const result = saltRequestSchema.safeParse(input);
  if (!result.success) {
    const errorCode =
      hasOwn(input, "username") && requiredUsernameSchema.safeParse(input.username).success
        ? AUTH_ERROR_CODES.usernameInvalid
        : AUTH_ERROR_CODES.usernameRequired;
    return { success: false, error: { code: errorCode } };
  }

  const normalizedUsername = normalizeUsername(result.data.username);
  const derivedSalt = deriveAuthSalt(normalizedUsername);
  const user = await findUserByUsername(normalizedUsername);
  return {
    success: true,
    data: user
      ? { keyScheduleVersion: user.keyScheduleVersion, salt: user.salt }
      : { keyScheduleVersion: CURRENT_AUTH_KEY_SCHEDULE.version, salt: derivedSalt },
  };
}

export async function createAccount(
  input: unknown,
  previousSessionId?: string,
): Promise<AuthServiceResult<CreatedAccount>> {
  const result = createAccountRequestSchema.safeParse(input);
  if (!result.success) {
    return INVALID_CREDENTIALS_RESPONSE;
  }

  const normalizedUsername = normalizeUsername(result.data.username);
  if (result.data.salt !== deriveAuthSalt(normalizedUsername)) {
    return INVALID_CREDENTIALS_RESPONSE;
  }

  const authKeyHash = await hashAuthKey(result.data.authKey);
  await sodium.ready;
  const user: StoredUser = {
    id: crypto.randomUUID(),
    username: normalizedUsername,
    displayName: result.data.username,
    authKeyHash: sodium.to_base64(authKeyHash, sodium.base64_variants.ORIGINAL),
    keyScheduleVersion: result.data.keyScheduleVersion,
    salt: result.data.salt,
  };
  const { session, sessionId } = createSessionToken(user.id);

  return (await createUserWithSession(user, session, toSessionHash(previousSessionId)))
    ? { success: true, data: { apiSession: { user: toPublicUser(user) }, sessionId } }
    : INVALID_CREDENTIALS_RESPONSE;
}

export async function verifyCredentials(
  input: unknown,
): Promise<AuthServiceResult<ApiAuthSession>> {
  const result = verifyCredentialsRequestSchema.safeParse(input);
  if (!result.success) {
    return INVALID_CREDENTIALS_RESPONSE;
  }
  const user = await findUserByUsername(normalizeUsername(result.data.username));
  const storedHash = user?.authKeyHash ?? DUMMY_AUTH_KEY_HASH;
  const hashMatches = await authKeyMatches(result.data.authKey, storedHash);
  if (user && result.data.keyScheduleVersion === user.keyScheduleVersion && hashMatches) {
    return { success: true, data: { user: toPublicUser(user) } };
  }
  return INVALID_CREDENTIALS_RESPONSE;
}
