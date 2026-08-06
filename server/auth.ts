import "server-only";

import sodium from "libsodium-wrappers-sumo";
import { AUTH_ERROR_CODES } from "@/api/auth/auth.error";
import {
  createAccountRequestSchema,
  saltRequestSchema,
  verifyCredentialsRequestSchema,
} from "@/api/auth/auth.schema";
import type {
  ApiCreateAccountResponse,
  ApiSaltResponse,
  ApiSessionResponse,
  ApiVerifyCredentialsResponse,
} from "@/api/auth/auth.type";
import type { User } from "@/api/auth/user.type";
import { type StoredUser, serverStore } from "@/server/store";

const ACCOUNT_SALT_LIFETIME_MS = 10 * 60 * 1_000;

async function generateSalt(): Promise<[string, Uint8Array]> {
  await sodium.ready;
  const rawSalt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);
  const saltBase64 = sodium.to_base64(rawSalt);
  return [saltBase64, rawSalt];
}

function toPublicUser(user: StoredUser): User {
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

  if (typeof username !== "string" || username.trim().length === 0) {
    return AUTH_ERROR_CODES.usernameRequired;
  }

  return AUTH_ERROR_CODES.usernameInvalid;
}

function findUser(username: string): StoredUser | undefined {
  const normalizedUsername = username.toLowerCase();

  return serverStore.users.find((user) => user.username.toLowerCase() === normalizedUsername);
}

async function hashAuthKey(authKey: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(authKey));

  return new Uint8Array(digest);
}

async function authKeyMatches(authKey: string, storedHash: string): Promise<boolean> {
  const candidateHash = await hashAuthKey(authKey);
  await sodium.ready;
  const expectedHash = sodium.from_base64(storedHash, sodium.base64_variants.ORIGINAL);
  // time safe equality check
  return sodium.memcmp(candidateHash, expectedHash);
}

export function getLoginSalt(input: unknown): ApiSaltResponse {
  const result = saltRequestSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      error: { code: getUsernameErrorCode(input) },
    } satisfies ApiSaltResponse;
  }

  const user = findUser(result.data.username);

  if (!user) {
    return {
      success: false,
      error: { code: AUTH_ERROR_CODES.invalidCredentials },
    } satisfies ApiSaltResponse;
  }

  return {
    success: true,
    data: { saltBase64: user.salt },
  } satisfies ApiSaltResponse;
}

export async function createAccountSalt(input: unknown): Promise<ApiSaltResponse> {
  const result = saltRequestSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      error: { code: getUsernameErrorCode(input) },
    } satisfies ApiSaltResponse;
  }

  const normalizedUsername = result.data.username.toLowerCase();

  if (findUser(normalizedUsername)) {
    return {
      success: false,
      error: { code: AUTH_ERROR_CODES.usernameTaken },
    } satisfies ApiSaltResponse;
  }

  const [saltBase64] = await generateSalt();
  serverStore.pendingAccountSalts.set(normalizedUsername, {
    salt: saltBase64,
    expiresAt: Date.now() + ACCOUNT_SALT_LIFETIME_MS,
  });

  return {
    success: true,
    data: { saltBase64 },
  } satisfies ApiSaltResponse;
}

export async function createAccount(input: unknown): Promise<ApiCreateAccountResponse> {
  await sodium.ready;
  const result = createAccountRequestSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      error: { code: AUTH_ERROR_CODES.invalidCredentials },
    } satisfies ApiCreateAccountResponse;
  }

  const normalizedUsername = result.data.username.toLowerCase();

  if (findUser(normalizedUsername)) {
    return {
      success: false,
      error: { code: AUTH_ERROR_CODES.usernameTaken },
    } satisfies ApiCreateAccountResponse;
  }

  const pendingSalt = serverStore.pendingAccountSalts.get(normalizedUsername);

  if (!pendingSalt || pendingSalt.expiresAt <= Date.now()) {
    serverStore.pendingAccountSalts.delete(normalizedUsername);
    return {
      success: false,
      error: { code: AUTH_ERROR_CODES.invalidCredentials },
    } satisfies ApiCreateAccountResponse;
  }
  const authKeyHash = await hashAuthKey(result.data.authKeyBase64);

  const user: StoredUser = {
    id: crypto.randomUUID(),
    username: normalizedUsername,
    displayName: result.data.username,
    authKeyHash: sodium.to_base64(authKeyHash, sodium.base64_variants.ORIGINAL),
    salt: pendingSalt.salt,
  };

  serverStore.users.push(user);
  serverStore.entriesByUserId.set(user.id, []);
  serverStore.pendingAccountSalts.delete(normalizedUsername);

  return {
    success: true,
    data: { user: toPublicUser(user) },
  } satisfies ApiCreateAccountResponse;
}

export async function verifyCredentials(input: unknown): Promise<ApiVerifyCredentialsResponse> {
  const result = verifyCredentialsRequestSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      error: { code: AUTH_ERROR_CODES.invalidCredentials },
    } satisfies ApiVerifyCredentialsResponse;
  }

  const user = findUser(result.data.username);
  const credentialsMatch = user
    ? await authKeyMatches(result.data.authKeyBase64, user.authKeyHash)
    : false;

  if (!user || !credentialsMatch) {
    return {
      success: false,
      error: { code: AUTH_ERROR_CODES.invalidCredentials },
    } satisfies ApiVerifyCredentialsResponse;
  }

  return {
    success: true,
    data: { user: toPublicUser(user) },
  } satisfies ApiVerifyCredentialsResponse;
}

export function getSession(userId: string | null): ApiSessionResponse {
  const user = userId ? serverStore.users.find(({ id }) => id === userId) : undefined;

  if (!user) {
    return {
      success: false,
      error: { code: AUTH_ERROR_CODES.unauthorized },
    };
  }

  return {
    success: true,
    data: { user: toPublicUser(user) },
  };
}
