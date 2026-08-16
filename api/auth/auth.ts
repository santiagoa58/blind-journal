import {
  authSessionSchema,
  logoutResponseSchema,
  passwordSchema,
  saltResponseSchema,
} from "@/api/auth/auth.schema";
import type {
  ApiCreateAccountRequest,
  ApiSaltRequest,
  ApiVerifyCredentialsRequest,
  ClientCreateAccountRequest,
  ClientLoginRequest,
} from "@/api/auth/auth.type";
import { AUTH_CLIENT_ERROR_CODES, AuthClientError } from "@/api/auth/auth-client.error";
import { deriveAuthUserKeysInWorker } from "@/api/auth/auth-worker-client";
import { api } from "@/api/http";

function assertValidPassword(password: string): void {
  const result = passwordSchema.safeParse(password);
  if (result.success) {
    return;
  }

  const exceedsMaximum = result.error.issues.some((issue) => issue.code === "too_big");
  if (exceedsMaximum) {
    throw new AuthClientError(AUTH_CLIENT_ERROR_CODES.passwordTooLong);
  }

  throw new AuthClientError(
    password.length === 0
      ? AUTH_CLIENT_ERROR_CODES.passwordRequired
      : AUTH_CLIENT_ERROR_CODES.passwordTooShort,
  );
}

export async function getAuthSalt(input: ApiSaltRequest) {
  const response = await api
    .post("auth/salt", {
      cache: "no-store",
      json: input,
    })
    .json<unknown>();
  return saltResponseSchema.parse(response);
}

async function verifyCredentials(input: ApiVerifyCredentialsRequest) {
  const response = await api
    .post("auth/login", {
      cache: "no-store",
      json: input,
    })
    .json<unknown>();
  return authSessionSchema.parse(response);
}

async function submitAccount(input: ApiCreateAccountRequest) {
  const response = await api
    .post("auth/accounts", {
      cache: "no-store",
      json: input,
    })
    .json<unknown>();
  return authSessionSchema.parse(response);
}

export async function logout() {
  const response = await api.post("auth/logout", { cache: "no-store" }).json<unknown>();
  return logoutResponseSchema.parse(response);
}

export async function login(input: ClientLoginRequest) {
  assertValidPassword(input.password);

  const { keyScheduleVersion, salt } = await getAuthSalt({ username: input.username });
  const userKeys = await deriveAuthUserKeysInWorker(input.password, salt, keyScheduleVersion);
  const request = {
    username: input.username,
    authKey: userKeys.authKey,
    keyScheduleVersion,
  } satisfies ApiVerifyCredentialsRequest;
  const response = await verifyCredentials(request);

  return { ...response.user, keyEncryptionKey: userKeys.keyEncryptionKey };
}

export async function createAccount(input: ClientCreateAccountRequest) {
  assertValidPassword(input.password);

  if (input.password !== input.confirmPassword) {
    throw new AuthClientError(AUTH_CLIENT_ERROR_CODES.passwordsMismatch);
  }

  const { keyScheduleVersion, salt } = await getAuthSalt({ username: input.username });

  const userKeys = await deriveAuthUserKeysInWorker(input.password, salt, keyScheduleVersion);
  const request = {
    username: input.username,
    authKey: userKeys.authKey,
    keyScheduleVersion,
    salt,
  } satisfies ApiCreateAccountRequest;
  const response = await submitAccount(request);

  return { ...response.user, keyEncryptionKey: userKeys.keyEncryptionKey };
}
