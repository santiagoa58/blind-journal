import sodium from "libsodium-wrappers-sumo";
import { AUTH_ERROR_CODES, type AuthErrorCode } from "@/api/auth/auth.error";
import {
  createAccountRequestSchema,
  normalizeUsername,
  requiredUsernameSchema,
  saltRequestSchema,
  verifyCredentialsRequestSchema,
} from "@/api/auth/auth.schema";
import type { ApiAuthSession, ApiSaltResponse } from "@/api/auth/auth.type";
import { CURRENT_AUTH_KEY_SCHEDULE } from "@/api/auth/auth-key-schedule";
import type { ApiUser } from "@/api/auth/user.type";
import { deriveAuthSalt } from "@/server/auth-salt";
import type { ServiceResult } from "@/server/service-result";
import type { ApplicationStore, StoredUser } from "@/server/store.type";
import type { Base64 } from "@/types/base64";

// TODO(review-high-auth-rate-limit-deployment): Replace this deployment assumption with an
// enforceable, documented control before release. No server-side limiter or repository-visible
// Vercel Firewall rule currently bounds the public salt, registration, or login endpoints. The
// selected control must work across function instances, return a predictable 429 experience, and
// respect the project's free-tier/no-overage constraint.
type AuthServiceResult<TData> = ServiceResult<TData, AuthErrorCode>;

function toPublicUser(user: StoredUser): ApiUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
  };
}

function getUsernameErrorCode(input: unknown) {
  if (typeof input !== "object" || input === null) {
    return AUTH_ERROR_CODES.usernameRequired;
  }

  const username = (input as Record<string, unknown>)["username"];

  return requiredUsernameSchema.safeParse(username).success
    ? AUTH_ERROR_CODES.usernameInvalid
    : AUTH_ERROR_CODES.usernameRequired;
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

export function createAuthService(store: ApplicationStore) {
  function getSaltMetadata(normalizedUsername: string): ApiSaltResponse {
    const derivedSalt = deriveAuthSalt(normalizedUsername);
    const user = store.findUserByUsername(normalizedUsername);

    return user
      ? { keyScheduleVersion: user.keyScheduleVersion, salt: user.salt }
      : { keyScheduleVersion: CURRENT_AUTH_KEY_SCHEDULE.version, salt: derivedSalt };
  }

  function getAuthSalt(input: unknown): AuthServiceResult<ApiSaltResponse> {
    const result = saltRequestSchema.safeParse(input);

    if (!result.success) {
      return { success: false, error: { code: getUsernameErrorCode(input) } };
    }

    const normalizedUsername = normalizeUsername(result.data.username);
    return { success: true, data: getSaltMetadata(normalizedUsername) };
  }

  async function createAccount(input: unknown): Promise<AuthServiceResult<ApiAuthSession>> {
    const result = createAccountRequestSchema.safeParse(input);
    if (!result.success) {
      return { success: false, error: { code: AUTH_ERROR_CODES.invalidCredentials } };
    }

    const normalizedUsername = normalizeUsername(result.data.username);
    if (result.data.salt !== deriveAuthSalt(normalizedUsername)) {
      return { success: false, error: { code: AUTH_ERROR_CODES.invalidCredentials } };
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

    return store.createUser(user)
      ? { success: true, data: { user: toPublicUser(user) } }
      : { success: false, error: { code: AUTH_ERROR_CODES.invalidCredentials } };
  }

  async function verifyCredentials(input: unknown): Promise<AuthServiceResult<ApiAuthSession>> {
    const result = verifyCredentialsRequestSchema.safeParse(input);
    if (!result.success) {
      return { success: false, error: { code: AUTH_ERROR_CODES.invalidCredentials } };
    }

    const user = store.findUserByUsername(result.data.username);
    // TODO(review-medium-auth-verification-timing): Unknown users skip hashing and constant-time
    // comparison while known users perform both. Responses are generic, but repeated timing samples
    // can still distinguish account existence. Always verify against either the stored hash or a
    // fixed valid dummy hash so both paths execute the same primitives.
    const credentialsMatch =
      user && result.data.keyScheduleVersion === user.keyScheduleVersion
        ? await authKeyMatches(result.data.authKey, user.authKeyHash)
        : false;
    return user && credentialsMatch
      ? { success: true, data: { user: toPublicUser(user) } }
      : { success: false, error: { code: AUTH_ERROR_CODES.invalidCredentials } };
  }

  return { createAccount, getAuthSalt, verifyCredentials };
}
