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
import { getAuthWorkerClient, terminateAuthWorkerClient } from "@/api/auth/auth-worker-client";
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

export async function getLoginSalt(input: ApiSaltRequest) {
  const response = await api
    .post("auth/login/salt", {
      cache: "no-store",
      json: input,
    })
    .json<unknown>();
  return saltResponseSchema.parse(response);
}

export async function getCreateAccountSalt(input: ApiSaltRequest) {
  const response = await api
    .post("auth/accounts/salt", {
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

  try {
    const { keyScheduleVersion, salt } = await getLoginSalt({ username: input.username });
    const userKeys = await getAuthWorkerClient().getUserKeys(
      input.password,
      salt,
      keyScheduleVersion,
    );
    const request = {
      username: input.username,
      authKey: userKeys.authKey,
      keyScheduleVersion,
    } satisfies ApiVerifyCredentialsRequest;
    const response = await verifyCredentials(request);

    return { ...response, keyEncryptionKey: userKeys.keyEncryptionKey };
  } finally {
    terminateAuthWorkerClient();
  }
}

export async function createAccount(input: ClientCreateAccountRequest) {
  assertValidPassword(input.password);

  if (input.password !== input.confirmPassword) {
    throw new AuthClientError(AUTH_CLIENT_ERROR_CODES.passwordsMismatch);
  }

  const { keyScheduleVersion, salt } = await getCreateAccountSalt({ username: input.username });

  try {
    const userKeys = await getAuthWorkerClient().getUserKeys(
      input.password,
      salt,
      keyScheduleVersion,
    );
    const request = {
      username: input.username,
      authKey: userKeys.authKey,
      keyScheduleVersion,
      salt,
    } satisfies ApiCreateAccountRequest;
    const response = await submitAccount(request);

    return { ...response, keyEncryptionKey: userKeys.keyEncryptionKey };
  } finally {
    terminateAuthWorkerClient();
  }
}
