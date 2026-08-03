import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { AUTH_ERROR_CODES } from "@/api/auth/auth.error";
import {
  createAccountRequestSchema,
  saltRequestSchema,
  verifyCredentialsRequestSchema,
} from "@/api/auth/auth.schema";
import type {
  CreateAccountResponse,
  LoginResponse,
  SaltResponse,
  SessionResponse,
} from "@/api/auth/auth.type";
import type { User } from "@/api/auth/user.type";
import { type StoredUser, serverStore } from "@/server/store";

const ACCOUNT_SALT_LIFETIME_MS = 10 * 60 * 1_000;

function toPublicUser(user: StoredUser): User {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
  };
}

function findUser(username: string): StoredUser | undefined {
  const normalizedUsername = username.toLowerCase();

  return serverStore.users.find((user) => user.username === normalizedUsername);
}

function getUsernameErrorCode(input: unknown): string {
  if (typeof input !== "object" || input === null) {
    return AUTH_ERROR_CODES.usernameRequired;
  }

  const username = (input as Record<string, unknown>)["username"];

  if (typeof username !== "string" || username.trim().length === 0) {
    return AUTH_ERROR_CODES.usernameRequired;
  }

  return AUTH_ERROR_CODES.usernameInvalid;
}

function hashAuthKey(authKey: string): Buffer {
  return createHash("sha256").update(authKey, "utf8").digest();
}

function authKeyMatches(authKey: string, storedHash: string): boolean {
  const candidateHash = hashAuthKey(authKey);
  const expectedHash = Buffer.from(storedHash, "base64");

  return (
    candidateHash.length === expectedHash.length && timingSafeEqual(candidateHash, expectedHash)
  );
}

export function getLoginSalt(input: unknown): SaltResponse {
  const result = saltRequestSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      error: { code: getUsernameErrorCode(input) },
    };
  }

  const user = findUser(result.data.username);

  if (!user) {
    return {
      success: false,
      error: { code: AUTH_ERROR_CODES.invalidCredentials },
    };
  }

  return {
    success: true,
    data: { salt: user.salt },
  };
}

export function createAccountSalt(input: unknown): SaltResponse {
  const result = saltRequestSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      error: { code: getUsernameErrorCode(input) },
    };
  }

  const normalizedUsername = result.data.username.toLowerCase();

  if (findUser(normalizedUsername)) {
    return {
      success: false,
      error: { code: AUTH_ERROR_CODES.usernameTaken },
    };
  }

  const salt = randomBytes(16).toString("base64");
  serverStore.pendingAccountSalts.set(normalizedUsername, {
    salt,
    expiresAt: Date.now() + ACCOUNT_SALT_LIFETIME_MS,
  });

  return {
    success: true,
    data: { salt },
  };
}

export function createAccount(input: unknown): CreateAccountResponse {
  const result = createAccountRequestSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      error: { code: AUTH_ERROR_CODES.invalidCredentials },
    };
  }

  const normalizedUsername = result.data.username.toLowerCase();

  if (findUser(normalizedUsername)) {
    return {
      success: false,
      error: { code: AUTH_ERROR_CODES.usernameTaken },
    };
  }

  const pendingSalt = serverStore.pendingAccountSalts.get(normalizedUsername);

  if (!pendingSalt || pendingSalt.expiresAt <= Date.now()) {
    serverStore.pendingAccountSalts.delete(normalizedUsername);
    return {
      success: false,
      error: { code: AUTH_ERROR_CODES.invalidCredentials },
    };
  }

  const user: StoredUser = {
    id: crypto.randomUUID(),
    username: normalizedUsername,
    displayName: result.data.username,
    authKeyHash: hashAuthKey(result.data.authKey).toString("base64"),
    salt: pendingSalt.salt,
  };

  serverStore.users.push(user);
  serverStore.entriesByUserId.set(user.id, []);
  serverStore.pendingAccountSalts.delete(normalizedUsername);

  return {
    success: true,
    data: { user: toPublicUser(user) },
  };
}

export function verifyCredentials(input: unknown): LoginResponse {
  const result = verifyCredentialsRequestSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      error: { code: AUTH_ERROR_CODES.invalidCredentials },
    };
  }

  const user = findUser(result.data.username);

  if (!user || !authKeyMatches(result.data.authKey, user.authKeyHash)) {
    return {
      success: false,
      error: { code: AUTH_ERROR_CODES.invalidCredentials },
    };
  }

  return {
    success: true,
    data: { user: toPublicUser(user) },
  };
}

export function getSession(userId: string | null): SessionResponse {
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
