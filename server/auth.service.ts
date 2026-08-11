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
import type { ApiUser } from "@/api/auth/user.type";
import type { ServiceResult } from "@/server/service-result";
import type { ApplicationStore, StoredUser } from "@/server/store.type";
import type { Base64 } from "@/types/base64";

const ACCOUNT_SALT_LIFETIME_MS = 10 * 60 * 1_000;

// TODO(review-high-auth-abuse-controls): Rate-limit salt, registration, and verification attempts
// and return decoy KDF metadata for unknown usernames so the username-first flow does not become an
// enumeration oracle. Expired pending salts also need bounded cleanup in the durable store.

type AuthServiceResult<TData> = ServiceResult<TData, AuthErrorCode>;

async function generateSalt(): Promise<Base64> {
  await sodium.ready;
  const rawSalt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);
  return sodium.to_base64(rawSalt, sodium.base64_variants.ORIGINAL);
}

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
  function getLoginSalt(input: unknown): AuthServiceResult<ApiSaltResponse> {
    const result = saltRequestSchema.safeParse(input);

    if (!result.success) {
      return { success: false, error: { code: getUsernameErrorCode(input) } };
    }

    const user = store.findUserByUsername(result.data.username);
    return user
      ? { success: true, data: { salt: user.salt } }
      : { success: false, error: { code: AUTH_ERROR_CODES.invalidCredentials } };
  }

  async function createAccountSalt(input: unknown): Promise<AuthServiceResult<ApiSaltResponse>> {
    const result = saltRequestSchema.safeParse(input);

    if (!result.success) {
      return { success: false, error: { code: getUsernameErrorCode(input) } };
    }

    const normalizedUsername = normalizeUsername(result.data.username);
    if (store.findUserByUsername(normalizedUsername)) {
      return { success: false, error: { code: AUTH_ERROR_CODES.usernameTaken } };
    }

    const salt = await generateSalt();
    store.setPendingAccountSalt(normalizedUsername, {
      salt,
      expiresAt: Date.now() + ACCOUNT_SALT_LIFETIME_MS,
    });
    return { success: true, data: { salt } };
  }

  async function createAccount(input: unknown): Promise<AuthServiceResult<ApiAuthSession>> {
    const result = createAccountRequestSchema.safeParse(input);
    if (!result.success) {
      return { success: false, error: { code: AUTH_ERROR_CODES.invalidCredentials } };
    }

    const normalizedUsername = normalizeUsername(result.data.username);
    // TODO(review-high-registration-atomicity): The existence check, pending-salt consumption,
    // user insert, and journal initialization must be one transactional operation backed by a
    // unique normalized-username constraint. Concurrent requests can currently create duplicates
    // or leave a partially initialized account.
    if (store.findUserByUsername(normalizedUsername)) {
      return { success: false, error: { code: AUTH_ERROR_CODES.usernameTaken } };
    }

    const pendingSalt = store.getPendingAccountSalt(normalizedUsername);
    if (!pendingSalt || pendingSalt.expiresAt <= Date.now()) {
      store.deletePendingAccountSalt(normalizedUsername);
      return { success: false, error: { code: AUTH_ERROR_CODES.invalidCredentials } };
    }

    const authKeyHash = await hashAuthKey(result.data.authKey);
    await sodium.ready;
    const user: StoredUser = {
      id: crypto.randomUUID(),
      username: normalizedUsername,
      displayName: result.data.username,
      authKeyHash: sodium.to_base64(authKeyHash, sodium.base64_variants.ORIGINAL),
      salt: pendingSalt.salt,
    };

    store.insertUser(user);
    store.initializeJournal(user.id);
    store.deletePendingAccountSalt(normalizedUsername);
    return { success: true, data: { user: toPublicUser(user) } };
  }

  async function verifyCredentials(input: unknown): Promise<AuthServiceResult<ApiAuthSession>> {
    const result = verifyCredentialsRequestSchema.safeParse(input);
    if (!result.success) {
      return { success: false, error: { code: AUTH_ERROR_CODES.invalidCredentials } };
    }

    const user = store.findUserByUsername(result.data.username);
    const credentialsMatch = user
      ? await authKeyMatches(result.data.authKey, user.authKeyHash)
      : false;
    return user && credentialsMatch
      ? { success: true, data: { user: toPublicUser(user) } }
      : { success: false, error: { code: AUTH_ERROR_CODES.invalidCredentials } };
  }

  return { createAccount, createAccountSalt, getLoginSalt, verifyCredentials };
}
